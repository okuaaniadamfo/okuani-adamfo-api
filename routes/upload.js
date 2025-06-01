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
/**
 * @swagger
 * /upload/voice:
 *   post:
 *     summary: Upload an audio file for speech-to-text transcription
 *     description: Accepts an audio file (wav or other audio mime type), sends it to Ghana NLP ASR API, and returns the transcription text.
 *     tags:
 *       - Audio
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Audio file to transcribe
 *     responses:
 *       200:
 *         description: Transcription successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transcription:
 *                   type: string
 *                   example: "This is the transcribed text from the audio."
 *       400:
 *         description: Bad Request (missing or invalid audio file)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No audio file uploaded."
 *       500:
 *         description: Internal server error during transcription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Voice transcription failed."
 */
uploadRoutes.post('/voice', upload.single('audio'), handleVoiceUpload);

// POST /upload/image
/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload an image file for crop disease prediction
 *     description: Accepts an image file (jpeg or other image mime type), sends it to the crop disease prediction API, and returns the prediction.
 *     tags:
 *       - Image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file for classification
 *     responses:
 *       200:
 *         description: Prediction successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prediction:
 *                   type: string
 *                   example: "Powdery Mildew"
 *       400:
 *         description: Bad Request (missing or invalid image file)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No image file uploaded."
 *       500:
 *         description: Internal server error during image classification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Image classification failed."
 */
uploadRoutes.post('/image', upload.single('image'), handleImageUpload);

export default uploadRoutes;