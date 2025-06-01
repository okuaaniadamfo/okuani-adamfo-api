import express from "express";
import { localizeOutput, getAvailableSpeakers } from '../controllers/output.js';

const outputRoutes = express.Router();

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
