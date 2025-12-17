import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  cancelRsvp,
  createEvent,
  deleteEvent,
  generateDescription,
  getEvent,
  listEvents,
  myOverview,
  rsvpEvent,
  updateEvent,
} from '../controllers/eventController.js';
import { authRequired, optionalAuth } from '../middleware/auth.js';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'server', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

router.get('/', optionalAuth, listEvents);
router.get('/mine', authRequired, myOverview);
router.get('/:id', optionalAuth, getEvent);
router.post('/generate-description', authRequired, generateDescription);
router.post('/', authRequired, upload.single('image'), createEvent);
router.put('/:id', authRequired, upload.single('image'), updateEvent);
router.delete('/:id', authRequired, deleteEvent);
router.post('/:id/rsvp', authRequired, rsvpEvent);
router.post('/:id/cancel', authRequired, cancelRsvp);

export default router;

