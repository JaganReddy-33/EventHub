import fs from 'fs';
import path from 'path';
import { Types } from 'mongoose';
import OpenAI from 'openai';
import { Event } from '../models/Event.js';
import { deleteImageFromCloudinary, isCloudinaryConfigured, uploadImageToCloudinary } from '../config/cloudinary.js';

// Initialize OpenAI client if API key is provided
let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const toDate = (value) => (value ? new Date(value) : null);

const ensureUploadsDir = () => {
  const uploadsPath = path.join(process.cwd(), 'server', 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  return uploadsPath;
};

const buildFilters = (query) => {
  const filters = {};
  if (query.search) {
    filters.$text = { $search: query.search };
  }
  if (query.from || query.to) {
    filters.dateTime = {};
    if (query.from) filters.dateTime.$gte = toDate(query.from);
    if (query.to) filters.dateTime.$lte = toDate(query.to);
  }
  if (query.future !== 'false') {
    filters.dateTime = filters.dateTime || {};
    filters.dateTime.$gte = filters.dateTime.$gte || new Date();
  }
  return filters;
};

export const listEvents = async (req, res, next) => {
  try {
    const filters = buildFilters(req.query || {});
    const events = await Event.find(filters)
      .populate('createdBy', 'name email')
      .sort({ dateTime: 1 });

    res.json({
      events: events.map((event) => {
        const obj = event.toObject();
        obj.isAttending = req.user ? event.attendees.some((id) => id.equals(req.user.id)) : false;
        obj.isOwner = req.user ? event.createdBy._id.equals(req.user.id) : false;
        obj.attendeeCount = event.attendees.length;
        return obj;
      }),
    });
  } catch (error) {
    next(error);
  }
};

export const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const obj = event.toObject();
    obj.isAttending = req.user ? event.attendees.some((id) => id.equals(req.user.id)) : false;
    obj.isOwner = req.user ? event.createdBy._id.equals(req.user.id) : false;
    obj.attendeeCount = event.attendees.length;
    res.json({ event: obj });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    // Ensure local uploads directory exists (used as temporary storage when uploading)
    ensureUploadsDir();
    const { title, description, dateTime, location, capacity } = req.body;
    
    // Validation
    if (!title || !description || !dateTime || !location || !capacity) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate capacity
    const capacityNum = Number(capacity);
    if (isNaN(capacityNum) || capacityNum < 1) {
      return res.status(400).json({ message: 'Capacity must be at least 1' });
    }

    // Validate date is in the future
    const eventDate = new Date(dateTime);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    if (eventDate < new Date()) {
      return res.status(400).json({ message: 'Event date must be in the future' });
    }

    let imageUrl;
    let imagePublicId;

    // If an image is provided, prefer uploading to Cloudinary
    if (req.file) {
      const localPath = path.join(process.cwd(), 'server', 'uploads', req.file.filename);

      if (isCloudinaryConfigured) {
        try {
          const { url, publicId } = await uploadImageToCloudinary(localPath);
          imageUrl = url;
          imagePublicId = publicId;
        } finally {
          // Best-effort cleanup of local temp file
          fs.unlink(localPath, () => {});
        }
      } else {
        // Fallback to local storage if Cloudinary is not configured
        imageUrl = `/uploads/${req.file.filename}`;
      }
    }
    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      dateTime: eventDate,
      location: location.trim(),
      capacity: capacityNum,
      imageUrl,
      imagePublicId,
      createdBy: req.user.id,
    });

    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    // Ensure local uploads directory exists (used as temporary storage when uploading)
    ensureUploadsDir();
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.createdBy.equals(req.user.id)) {
      return res.status(403).json({ message: 'You can only edit your events' });
    }

    const updates = {};
    
    // Only update provided fields
    if (req.body.title) updates.title = req.body.title.trim();
    if (req.body.description) updates.description = req.body.description.trim();
    if (req.body.location) updates.location = req.body.location.trim();
    
    // Validate and update dateTime
    if (req.body.dateTime) {
      const eventDate = new Date(req.body.dateTime);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      updates.dateTime = eventDate;
    }
    
    // Validate and update capacity
    if (req.body.capacity !== undefined) {
      const capacityNum = Number(req.body.capacity);
      if (isNaN(capacityNum) || capacityNum < 1) {
        return res.status(400).json({ message: 'Capacity must be at least 1' });
      }
      // Don't allow reducing capacity below current attendee count
      if (capacityNum < event.attendees.length) {
        return res.status(400).json({ 
          message: `Cannot set capacity below current attendee count (${event.attendees.length})` 
        });
      }
      updates.capacity = capacityNum;
    }
    
    if (req.file) {
      const localPath = path.join(process.cwd(), 'server', 'uploads', req.file.filename);

      if (isCloudinaryConfigured) {
        try {
          // Delete previous Cloudinary image if exists
          if (event.imagePublicId) {
            await deleteImageFromCloudinary(event.imagePublicId);
          }
          const { url, publicId } = await uploadImageToCloudinary(localPath);
          updates.imageUrl = url;
          updates.imagePublicId = publicId;
        } finally {
          // Best-effort cleanup of local temp file
          fs.unlink(localPath, () => {});
        }
      } else {
        updates.imageUrl = `/uploads/${req.file.filename}`;
      }
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ event: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.createdBy.equals(req.user.id)) {
      return res.status(403).json({ message: 'You can only delete your events' });
    }

    // Best-effort Cloudinary cleanup
    if (isCloudinaryConfigured && event.imagePublicId) {
      await deleteImageFromCloudinary(event.imagePublicId);
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};

export const rsvpEvent = async (req, res, next) => {
  try {
    const userId = new Types.ObjectId(req.user.id);
    const eventId = req.params.id;

    // First, verify event exists and check if it's in the past
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is in the past
    if (new Date(event.dateTime) < new Date()) {
      return res.status(400).json({ message: 'Cannot RSVP to past events' });
    }

    // Check if user is already attending (pre-check for better error message)
    if (event.attendees.some((id) => id.equals(userId))) {
      return res.status(400).json({ message: 'You are already attending this event' });
    }

    // Atomic operation: Only update if capacity allows AND user is not already in attendees
    // This prevents race conditions when multiple users RSVP simultaneously
    const updated = await Event.findOneAndUpdate(
      {
        _id: eventId,
        attendees: { $ne: userId }, // User not already in attendees array
        $expr: { $lt: [{ $size: '$attendees' }, '$capacity'] }, // Capacity check: current size < capacity
      },
      { $addToSet: { attendees: userId } }, // Atomic add (also prevents duplicates)
      { new: true },
    ).populate('createdBy', 'name email');

    // If update failed, it means either:
    // 1. User is already attending (handled above)
    // 2. Capacity is full (race condition - another user took the last spot)
    if (!updated) {
      // Re-fetch to get current state
      const currentEvent = await Event.findById(eventId);
      if (currentEvent.attendees.some((id) => id.equals(userId))) {
        return res.status(400).json({ message: 'You are already attending this event' });
      }
      if (currentEvent.attendees.length >= currentEvent.capacity) {
        return res.status(409).json({ message: 'Event is fully booked. Please try again.' });
      }
      return res.status(400).json({ message: 'Unable to RSVP at this time. Please try again.' });
    }

    res.json({
      event: {
        ...updated.toObject(),
        isAttending: true,
        isOwner: updated.createdBy._id.equals(req.user.id),
        attendeeCount: updated.attendees.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelRsvp = async (req, res, next) => {
  try {
    const userId = new Types.ObjectId(req.user.id);
    const eventId = req.params.id;

    const updated = await Event.findOneAndUpdate(
      { _id: eventId, attendees: userId },
      { $pull: { attendees: userId } },
      { new: true },
    ).populate('createdBy', 'name email');

    if (!updated) {
      return res.status(400).json({ message: 'You are not attending this event' });
    }

    res.json({
      event: {
        ...updated.toObject(),
        isAttending: false,
        isOwner: updated.createdBy._id.equals(req.user.id),
        attendeeCount: updated.attendees.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const myOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const created = await Event.find({ createdBy: userId })
      .populate('createdBy', 'name email')
      .sort({ dateTime: 1 });
    const attending = await Event.find({ attendees: userId })
      .populate('createdBy', 'name email')
      .sort({ dateTime: 1 });
    
    res.json({
      created: created.map((event) => ({
        ...event.toObject(),
        isAttending: false,
        isOwner: true,
        attendeeCount: event.attendees.length,
      })),
      attending: attending.map((event) => ({
        ...event.toObject(),
        isAttending: true,
        isOwner: event.createdBy._id.equals(userId),
        attendeeCount: event.attendees.length,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const generateDescription = async (req, res, next) => {
  try {
    const { title, dateTime, location } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const dateStr = dateTime
      ? new Date(dateTime).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'soon';

    const locationStr = location || 'a fantastic venue';

    // If OpenAI is configured, use real AI to generate the description
    if (openaiClient) {
      try {
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

        const prompt = `You are an assistant that writes engaging, friendly event descriptions.
Write a concise 2-3 paragraph description for an event.

Event details:
- Title: ${title}
- Date: ${dateStr}
- Location: ${locationStr}

The tone should be positive, welcoming, and suitable for a general audience.
Do NOT repeat the title in the first line; assume it will be shown separately.
Return only the description text without any markdown or headings.`;

        const completion = await openaiClient.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You write clear, engaging event descriptions for a mini event platform.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 220,
        });

        const aiText = completion.choices[0]?.message?.content?.trim();
        if (aiText) {
          return res.json({ description: aiText });
        }
        // If AI returned an empty response, fall through to fallback
      } catch (err) {
        console.error('OpenAI description generation failed:', err?.message || err);
        // Fall back to simple template below
      }
    }

    // Fallback: simple template-based description (used if OpenAI is not configured or fails)
    const generatedDescription = `Join us for ${title}!

This exciting event will take place on ${dateStr} at ${locationStr}.

Don't miss out on this opportunity to connect, learn, and have a great time. Whether you're looking to network, discover something new, or simply enjoy a memorable experience, this event promises something special for everyone.`;

    res.json({ description: generatedDescription });
  } catch (error) {
    next(error);
  }
};

