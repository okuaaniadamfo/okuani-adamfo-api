import { Router } from 'express';
import multer from 'multer';
import { handleVoiceUpload, handleImageUpload, getSupportedLanguages,testGhanaNLPConnection, localizeLanguage, convertSolutionsToAudio} from '../controllers/upload.js'
import sharp from 'sharp';

const uploadRoutes = Router();

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Allow only single file uploads
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      if (!/audio\/(mpeg|wav|ogg|mp3|m4a)/.test(file.mimetype)) {
        return cb(new Error('Only audio files are allowed (MP3, WAV, OGG, M4A)'), false);
      }
      cb(null, true);
    } else if (file.fieldname === 'file') {
      if (!/image\/(jpeg|png|jpg|gif)/.test(file.mimetype)) {
        return cb(new Error('Only image files are allowed (JPEG, PNG, JPG, GIF)'), false);
      }
      cb(null, true);
    }
  }
});

// Enhanced CORS middleware for upload routes
uploadRoutes.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Request logging middleware
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
uploadRoutes.post('/voice', upload.single('audio'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No audio file uploaded.',
      supportedFormats: ['MP3', 'WAV', 'OGG', 'M4A']
    });
  }
  next();
}, handleVoiceUpload);

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
uploadRoutes.post('/image', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No image file uploaded.',
      supportedFormats: ['JPEG', 'PNG', 'JPG', 'GIF']
    });
  }

  try {
    // Use sharp to validate the image
    const image = sharp(req.file.buffer);
    const metadata = await image.metadata();

    // Example validation checks
    if (!['jpeg', 'png', 'jpg', 'gif'].includes(metadata.format)) {
      return res.status(400).json({ error: 'Unsupported image format.' });
    }

    if (metadata.width < 100 || metadata.height < 100) {
      return res.status(400).json({ error: 'Image is too small. Minimum size is 100x100 pixels.' });
    }

    // Optional: log metadata for debugging
    console.log('Image metadata:', metadata);

    next(); // Proceed to handleImageUpload

  } catch (err) {
    console.error('Image validation failed:', err);
    return res.status(400).json({ error: 'Invalid image file.' });
  }
}, handleImageUpload);


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
 *     description: Takes an array of solution texts and converts them to speech in the specified language.
 *     tags:
 *       - Audio
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
 *                 example: ["Use neem oil", "Apply fungicide every 7 days"]
 *               language:
 *                 type: string
 *                 enum: [tw, gaa, dag, yo, ee, ki, ha]
 *                 example: tw
 *     responses:
 *       200:
 *         description: Successfully converted all solutions to audio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 audios:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       text:
 *                         type: string
 *                       audio:
 *                         type: string
 *                         description: Base64 encoded audio data
 *       400:
 *         description: Bad request (missing or invalid solutions array)
 *       500:
 *         description: Internal server error
 */
uploadRoutes.post('/solutions-to-audio', convertSolutionsToAudio);




// error-handling middleware
uploadRoutes.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message, err.stack || '');

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'File upload error',
      details: err.message,
      code: err.code
    });
  }

  if (err.message.includes('Only audio files are allowed') ||
      err.message.includes('Only image files are allowed') ||
      err.message.includes('Unexpected field name')) {
    return res.status(400).json({
      error: 'Invalid file type or field',
      details: err.message
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});


export default uploadRoutes;
