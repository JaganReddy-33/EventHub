import { Schema, model } from 'mongoose';

const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    dateTime: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String },
    imagePublicId: { type: String }, // Cloudinary public_id (optional)
    attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

eventSchema.index({ title: 'text', description: 'text', location: 'text' });
// Compound index to prevent duplicate RSVPs and improve query performance
eventSchema.index({ _id: 1, attendees: 1 });

export const Event = model('Event', eventSchema);

