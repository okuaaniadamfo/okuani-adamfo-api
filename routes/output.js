import express from "express";
import { localizeOutput } from '../controllers/output.js';

const outputRoutes = express.Router();

// POST /output/localize
/**
 * @swagger
 * /output/localize:
 *   post:
 *     summary: Translate diagnosis and generate TTS audio
 *     description: |
 *       Translates the combined diagnosis result into the selected local language
 *       and generates an audio file URL using Text-to-Speech (TTS).
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
 *                   example: "Symptoms reported: Patient reports coughing. Visual analysis suggests mildew on leaves."
 *                 audioURL:
 *                   type: string
 *                   description: URL to the generated TTS audio file
 *                   example: "https://example.com/audio/640f1234abcd5678ef901234.mp3"
 *       400:
 *         description: Missing diagnosisId in request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Diagnosis ID is required."
 *       404:
 *         description: Diagnosis not found for the given ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Diagnosis not found."
 *       500:
 *         description: Server error during localization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Localization failed."
 */
outputRoutes.post('/localize', localizeOutput);

export default outputRoutes;