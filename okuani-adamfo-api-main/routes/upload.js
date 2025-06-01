import { Router } from 'express';
import multer from 'multer';
import { handleVoiceUpload, handleImageUpload, getSupportedLanguages,testGhanaNLPConnection} from '../controllers/upload.js'

const uploadRoutes = Router();

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB for longer audio files
    fieldSize: 50 * 1024 * 1024
  }
});

// GET /upload/test-connection - Test Ghana NLP API connectivity
/**
 * @swagger
 * /upload/test-connection:
 *   get:
 *     summary: Test Ghana NLP API connectivity
 *     description: Tests if the Ghana NLP API is reachable and API key is configured
 *     tags:
 *       - Audio
 *     responses:
 *       200:
 *         description: API is reachable
 *       500:
 *         description: Cannot connect to API
 */
uploadRoutes.get('/test-connection', testGhanaNLPConnection);


// GET /upload/languages - Get supported languages
/**
 * @swagger
 * /upload/languages:
 *   get:
 *     summary: Get supported languages for speech recognition
 *     description: Returns a list of supported languages for the Ghana NLP ASR service
 *     tags:
 *       - Audio
 *     responses:
 *       200:
 *         description: List of supported languages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 supportedLanguages:
 *                   type: object
 *                   properties:
 *                     tw:
 *                       type: string
 *                       example: "Twi"
 *                     gaa:
 *                       type: string
 *                       example: "Ga"
 *                     dag:
 *                       type: string
 *                       example: "Dagbani"
 *                     yo:
 *                       type: string
 *                       example: "Yoruba"
 *                     ee:
 *                       type: string
 *                       example: "Ewe"
 *                     ki:
 *                       type: string
 *                       example: "Kikuyu"
 *                     ha:
 *                       type: string
 *                       example: "Hausa"
 *                 defaultLanguage:
 *                   type: string
 *                   example: "tw"
 */
uploadRoutes.get('/languages', getSupportedLanguages);

// POST /upload/voice
/**
 * @swagger
 * /upload/voice:
 *   post:
 *     summary: Upload an audio file for speech-to-text transcription
 *     description: Accepts an audio file and language parameter, sends it to Ghana NLP ASR API, and returns the transcription text.
 *     tags:
 *       - Audio
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file to transcribe (mp3, wav, etc.)
 *               language:
 *                 type: string
 *                 description: Language code for transcription
 *                 enum: [tw, gaa, dag, yo, ee, ki, ha]
 *                 default: tw
 *                 example: tw
 *             required:
 *               - audio
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [tw, gaa, dag, yo, ee, ki, ha]
 *           default: tw
 *         description: Language code for transcription (can also be sent in form data)
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
 *                 language:
 *                   type: string
 *                   example: "tw"
 *                 languageName:
 *                   type: string
 *                   example: "Twi"
 *                 confidence:
 *                   type: number
 *                   nullable: true
 *                   example: 0.95
 *                 duration:
 *                   type: number
 *                   nullable: true
 *                   example: 5.2
 *                 rawResponse:
 *                   type: object
 *                   description: Raw response from Ghana NLP API
 *       400:
 *         description: Bad Request (missing/invalid audio file or unsupported language)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No audio file uploaded."
 *                 supportedLanguages:
 *                   type: object
 *                   description: Available when language is unsupported
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
 *                 details:
 *                   type: string
 *                   example: "Detailed error message"
 */
uploadRoutes.post('/voice', upload.single('audio'), handleVoiceUpload);

// POST /upload/image
/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload an image for crop disease prediction
 *     description: Accepts an image file, sends it to the plant disease prediction API, and returns the diagnosis.
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
 *                 description: Image file to analyze
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: Image analysis successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 prediction:
 *                   type: object
 *                   properties:
 *                     disease:
 *                       type: string
 *                       example: "Tomato Late Blight"
 *                     confidence:
 *                       type: number
 *                       example: 87
 *                     filename:
 *                       type: string
 *                       example: "uploaded_image.jpg"
 *                     predictionIndex:
 *                       type: number
 *                       example: 2
 *       400:
 *         description: Bad Request (missing or invalid image file)
 *       500:
 *         description: Internal server error during image processing
 */
uploadRoutes.post('/image', upload.single('file'), handleImageUpload);

export default uploadRoutes;
