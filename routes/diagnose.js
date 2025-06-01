import express from "express";
import { createDiagnosis } from '../controllers/diagnose.js';

const diagnoseRoutes = express.Router();

// POST /diagnose
/**
 * @swagger
 * components:
 *   schemas:
 *     Diagnosis:
 *       type: object
 *       required:
 *         - combinedResult
 *         - language
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the diagnosis
 *         voiceInput:
 *           type: string
 *           nullable: true
 *         imageResult:
 *           type: string
 *           nullable: true
 *         combinedResult:
 *           type: string
 *         localizedText:
 *           type: string
 *           nullable: true
 *         audioURL:
 *           type: string
 *           nullable: true
 *         language:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of creation
 *       example:
 *         _id: "64ab12345678b1234567abcd"
 *         voiceInput: "The leaves are turning yellow"
 *         imageResult: "Possible nitrogen deficiency"
 *         combinedResult: "Symptoms reported: The leaves are turning yellow. Visual analysis suggests: Possible nitrogen deficiency."
 *         localizedText: "Localized translation here"
 *         audioURL: "https://example.com/audio.mp3"
 *         language: "tw"
 *         createdAt: "2024-06-01T12:00:00.000Z"
 */

/**
 * @swagger
 * /diagnose:
 *   post:
 *     summary: Create a new diagnosis entry
 *     description: Creates a diagnosis record combining voice input and/or image result with a specified language.
 *     tags:
 *       - Diagnosis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               voiceInput:
 *                 type: string
 *                 example: "Patient reports coughing and fatigue"
 *               imageResult:
 *                 type: string
 *                 example: "Leaves show signs of powdery mildew"
 *               combinedResult:
 *                 type: string
 *                 example: "Voice and image results combined"
 *               localizedText:
 *                 type: string
 *                 example: "Localized text here"
 *               audioURL:
 *                 type: string
 *                 example: "https://example.com/audio.mp3"
 *               language:
 *                 type: string
 *                 example: "en"
 *             required:
 *               - combinedResult
 *               - language
 *     responses:
 *       201:
 *         description: Diagnosis created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Diagnosis created successfully."
 *                 diagnosis:
 *                   $ref: '#/components/schemas/Diagnosis'
 *       400:
 *         description: Bad request, missing voiceInput and imageResult
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Either voiceInput or imageResult must be provided."
 *       500:
 *         description: Server error while creating diagnosis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to create diagnosis."
 */
diagnoseRoutes.post('/', createDiagnosis);

export default diagnoseRoutes;