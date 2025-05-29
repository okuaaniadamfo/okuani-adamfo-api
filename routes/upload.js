import { Router } from 'express';
import multer from 'multer';
import { handleVoiceUpload, handleImageUpload } from '../controllers/upload.js'

const uploadRoutes = Router();

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// POST /upload/voice
uploadRoutes.post('/voice', upload.single('audio'), handleVoiceUpload);

// POST /upload/image
uploadRoutes.post('/image', upload.single('image'), handleImageUpload);

export default uploadRoutes;