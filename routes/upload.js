import { Router } from 'express';
import multer from 'multer';
import { handleVoiceUpload, handleImageUpload, getSupportedLanguages,testGhanaNLPConnection, localizeLanguage, convertSolutionsToAudio} from '../controllers/upload.js'

const uploadRoutes = Router();

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Allow only single file uploads
  },
  fileFilter: (req, file, cb) => {
    // For voice uploads
    if (file.fieldname === 'audio') {
      if (!file.mimetype.match(/audio\/(mpeg|wav|ogg|mp3|m4a)/)) {
        return cb(new Error('Only audio files are allowed (MP3, WAV, OGG, M4A)'), false);
      }
      cb(null, true);
    }
    // For image uploads
    else if (file.fieldname === 'file') {
      if (!file.mimetype.match(/image\/(jpeg|png|jpg|gif)/)) {
        return cb(new Error('Only image files are allowed (JPEG, PNG, JPG, GIF)'), false);
      }
      cb(null, true);
    } else {
      // Reject files with unexpected field names
      cb(new Error(`Unexpected field name: ${file.fieldname}`), false);
    }
  }
});

// Add request logging middleware
uploadRoutes.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
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
// uploadRoutes.post('/image', 
//   upload.single('file'),
//   (req, res, next) => {
//     if (!req.file) {
//       return res.status(400).json({ 
//         error: 'No image file uploaded',
//         supportedFormats: ['JPEG', 'PNG', 'JPG', 'GIF']
//       });
//     }
//     console.log('Image file received:', {
//       originalname: req.file.originalname,
//       mimetype: req.file.mimetype,
//       size: req.file.size
//     });
//     next();
//   },
//   handleImageUpload
// );


// Error handling middleware for Multer


// Add these to your uploadRoutes in upload.js routes file

/**
 * @swagger
 * /upload/localizelanguage:
 *   post:
 *     summary: Convert text to speech in specified language
 *     description: Uses GhanaNLP TTS API to convert text to audio in supported languages
 *     tags:
 *       - Audio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to convert to speech
 *                 example: "Hello world"
 *               language:
 *                 type: string
 *                 description: Language code for TTS
 *                 enum: [tw, gaa, dag, yo, ee, ki, ha]
 *                 default: tw
 *                 example: tw
 *               speaker_id:
 *                 type: string
 *                 description: Specific speaker ID for the language
 *                 example: "twi_speaker_4"
 *             required:
 *               - text
 *     responses:
 *       200:
 *         description: Audio conversion successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 audio:
 *                   type: string
 *                   description: Base64 encoded audio data
 *                 format:
 *                   type: string
 *                   example: "audio/mpeg"
 *                 language:
 *                   type: string
 *                   example: "tw"
 *                 speaker_id:
 *                   type: string
 *                   example: "twi_speaker_4"
 *                 text_length:
 *                   type: number
 *                   example: 11
 *       400:
 *         description: Bad request (missing text or unsupported language)
 *       500:
 *         description: Internal server error during TTS conversion
 */
uploadRoutes.post('/localizelanguage', localizeLanguage);

/**
 * @swagger
 * /upload/solutions-to-audio:
 *   post:
 *     summary: Convert plant disease solutions to audio
 *     description: Takes an array of solution texts and converts them to speech in specified language
 *     tags:
 *       - Image
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               solutions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of solution texts to convert
 *                 example: ["Plant resistant varieties", "Use crop rotation"]
 *               language:
 *                 type: string
 *                 description: Language code for TTS
 *                 enum: [tw, gaa, dag, yo, ee, ki, ha]
 *                 default: tw
 *                 example: tw
 *               speaker_id:
 *                 type: string
 *                 description: Specific speaker ID for the language
 *                 example: "twi_speaker_4"
 *             required:
 *               - solutions
 *     responses:
 *       200:
 *         description: Audio conversion successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 audio:
 *                   type: string
 *                   description: Base64 encoded audio data
 *                 format:
 *                   type: string
 *                   example: "audio/mpeg"
 *                 language:
 *                   type: string
 *                   example: "tw"
 *                 speaker_id:
 *                   type: string
 *                   example: "twi_speaker_4"
 *                 solution_count:
 *                   type: number
 *                   example: 2
 *                 text_length:
 *                   type: number
 *                   example: 42
 *       400:
 *         description: Bad request (missing solutions or unsupported language)
 *       500:
 *         description: Internal server error during TTS conversion
 */
uploadRoutes.post('/solutions-to-audio', convertSolutionsToAudio);



uploadRoutes.use((err, req, res, next) => {
  // Log any error that reaches this middleware
  if (err) {
    console.error(`[${new Date().toISOString()}] Error in UPLOAD route [${req.method} ${req.path}]:`, err.message, err.stack || '');
  }

  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    return res.status(400).json({
      error: 'File upload error',
      details: err.message,
      code: err.code
    });
  } else if (err) {
    // Handle custom errors from fileFilter or other synchronous errors
    if (err.message.includes('Only audio files are allowed') ||
        err.message.includes('Only image files are allowed') ||
        err.message.includes('Unexpected field name')) {
      return res.status(400).json({
        error: 'Invalid file type or field',
        details: err.message
      });
    }
    // For other unhandled errors
    return res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
  next();
});

export default uploadRoutes;
