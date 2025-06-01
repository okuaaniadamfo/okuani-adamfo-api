import express from "express";
import multer from "multer";
import { 
  localizeOutput, 
  getAvailableSpeakers, 
  transcribeAudio, 
  processAudioAndLocalize, 
  getSupportedASRLanguages 
} from '../controllers/output.js';

const outputRoutes = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// GET /output/speakers/:language - Get available speakers for a language
/**
 * @swagger
 * 
 * /output/speakers/{language}:
 *   get:
 *     summary: Get available TTS speakers for a language
 *     description: Returns available speaker IDs for the specified language
 *     tags:
 *       - Localization
 *     parameters:
 *       - in: path
 *         name: language
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tw, ki, ee]
 *         description: Language code (tw=Twi, ki=Kikuyu, ee=Ewe)
 *     responses:
 *       200:
 *         description: Available speakers for the language
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 language:
 *                   type: string
 *                   example: "tw"
 *                 availableSpeakers:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["twi_speaker_4", "twi_speaker_5", "twi_speaker_6"]
 *                 defaultSpeaker:
 *                   type: string
 *                   example: "twi_speaker_4"
 */
outputRoutes.get('/speakers/:language', getAvailableSpeakers);

// GET /output/asr-languages - Get supported ASR languages
/**
 * @swagger
 * /output/asr-languages:
 *   get:
 *     summary: Get supported ASR languages
 *     description: Returns all languages supported by the Automatic Speech Recognition API
 *     tags:
 *       - Speech Recognition
 *     responses:
 *       200:
 *         description: List of supported ASR languages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 supportedLanguages:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["tw", "gaa", "dag", "yo", "ee", "ki", "ha"]
 *                 languageDetails:
 *                   type: object
 *                   example: {"tw": "Twi", "gaa": "Ga", "dag": "Dagbani"}
 */
outputRoutes.get('/asr-languages', getSupportedASRLanguages);

// POST /output/transcribe - Transcribe audio to text
/**
 * @swagger
 * /output/transcribe:
 *   post:
 *     summary: Transcribe audio to text using ASR
 *     description: |
 *       Converts audio input to text using GhanaNLP Automatic Speech Recognition API.
 *       Supports multiple audio formats and languages.
 *     tags:
 *       - Speech Recognition
 *     parameters:
 *       - in: query
 *         name: language
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tw, gaa, dag, yo, ee, ki, ha]
 *         description: Language code for ASR
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
 *                 description: Audio file to transcribe
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               audioData:
 *                 type: string
 *                 description: Base64 encoded audio data
 *                 example: "data:audio/mpeg;base64,..."
 *     responses:
 *       200:
 *         description: Audio transcription completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Audio transcription completed."
 *                 transcribedText:
 *                   type: string
 *                   example: "Hello, how are you today?"
 *                 language:
 *                   type: string
 *                   example: "tw"
 *                 originalAudioSize:
 *                   type: number
 *                   example: 1024000
 *       400:
 *         description: Missing language parameter or audio data
 *       500:
 *         description: Transcription failed
 */
outputRoutes.post('/transcribe', upload.single('audio'), transcribeAudio);

// POST /output/process-audio - Complete audio processing workflow
/**
 * @swagger
 * /output/process-audio:
 *   post:
 *     summary: Process audio input with transcription and TTS
 *     description: |
 *       Complete workflow that transcribes audio to text, creates a diagnosis record,
 *       and optionally generates TTS audio output. Combines ASR and TTS functionality.
 *     tags:
 *       - Speech Recognition
 *       - Localization
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
 *                 description: Audio file to process
 *               language:
 *                 type: string
 *                 enum: [tw, gaa, dag, yo, ee, ki, ha]
 *                 description: Language code for processing
 *               speakerId:
 *                 type: string
 *                 description: Optional speaker ID for TTS output
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               audioData:
 *                 type: string
 *                 description: Base64 encoded audio data
 *               language:
 *                 type: string
 *                 enum: [tw, gaa, dag, yo, ee, ki, ha]
 *               speakerId:
 *                 type: string
 *                 description: Optional speaker ID for TTS output
 *             required:
 *               - language
 *     responses:
 *       200:
 *         description: Audio processing completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Audio processing and localization completed."
 *                 diagnosisId:
 *                   type: string
 *                   example: "640f1234abcd5678ef901234"
 *                 transcribedText:
 *                   type: string
 *                   example: "Patient reports headache and fever"
 *                 localizedText:
 *                   type: string
 *                   example: "Patient reports headache and fever"
 *                 audioURL:
 *                   type: string
 *                   example: "data:audio/wav;base64,..."
 *                 speakerId:
 *                   type: string
 *                   example: "twi_speaker_4"
 *                 language:
 *                   type: string
 *                   example: "tw"
 *                 inputMethod:
 *                   type: string
 *                   example: "audio"
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Processing failed
 */
outputRoutes.post('/process-audio', upload.single('audio'), processAudioAndLocalize);

// POST /output/localize
/**
 * @swagger
 * /output/localize:
 *   post:
 *     summary: Translate diagnosis and generate TTS audio
 *     description: |
 *       Translates the combined diagnosis result into the selected local language
 *       and generates an audio file using GhanaNLP Text-to-Speech API.
 *       Updates the diagnosis record with localized text and audio URL.
 *     tags:
 *       - Localization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diagnosisId:
 *                 type: string
 *                 description: The ID of the diagnosis to localize
 *                 example: "640f1234abcd5678ef901234"
 *               speakerId:
 *                 type: string
 *                 description: Optional speaker ID for TTS voice selection
 *                 example: "twi_speaker_4"
 *             required:
 *               - diagnosisId
 *     responses:
 *       200:
 *         description: Localization completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Localization completed."
 *                 localizedText:
 *                   type: string
 *                   description: Translated diagnosis text in the target language
 *                   example: "Symptoms reported: Patient reports coughing."
 *                 audioURL:
 *                   type: string
 *                   description: Base64 encoded audio data URL
 *                   example: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEA..."
 *                 speakerId:
 *                   type: string
 *                   example: "twi_speaker_4"
 *                 language:
 *                   type: string
 *                   example: "tw"
 *       400:
 *         description: Missing diagnosisId or unsupported language
 *       404:
 *         description: Diagnosis not found
 *       500:
 *         description: Localization failed
 */
outputRoutes.post('/localize', localizeOutput);

export default outputRoutes;
