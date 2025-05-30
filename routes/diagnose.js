import express from "express";
import { createDiagnosis } from '../controllers/diagnose.js';

const diagnoseRoutes = express.Router();

// POST /diagnose
/**
 * @swagger
 * /diagnosis:
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
 *                 description: Verbal symptoms or voice input from the user
 *                 example: "Patient reports coughing and fatigue"
 *               imageResult:
 *                 type: string
 *                 description: Result of image-based analysis (e.g., crop disease or visual symptoms)
 *                 example: "Leaves show signs of powdery mildew"
 *               language:
 *                 type: string
 *                 description: Language code of the diagnosis input (e.g., 'en', 'ak', 'ee')
 *                 example: "en"
 *             required:
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
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Unique diagnosis ID
 *                       example: "640f1234abcd5678ef901234"
 *                     voiceInput:
 *                       type: string
 *                       nullable: true
 *                       example: "Patient reports coughing and fatigue"
 *                     imageResult:
 *                       type: string
 *                       nullable: true
 *                       example: "Leaves show signs of powdery mildew"
 *                     combinedResult:
 *                       type: string
 *                       example: "Symptoms reported: Patient reports coughing and fatigue. Visual analysis suggests: Leaves show signs of powdery mildew."
 *                     language:
 *                       type: string
 *                       example: "en"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-05-30T12:34:56.789Z"
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