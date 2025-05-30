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
