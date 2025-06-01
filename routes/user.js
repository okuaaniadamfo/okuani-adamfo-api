import express from 'express';
import { loginUser, registerUser } from '../controllers/user.js';

const userRoutes = express.Router();

/**
 * @swagger
 * components:
 * 
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - firstName
 *         - lastName
 *         - phoneNumber
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique ID
 *         username:
 *           type: string
 *           description: Unique username for login
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phoneNumber:
 *           type: string
 *           description: User's phone number
 *         password:
 *           type: string
 *           description: Hashed password (never exposed in responses)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *       example:
 *         _id: "64ab12345678b1234567abcd"
 *         username: "john_doe"
 *         firstName: "John"
 *         lastName: "Doe"
 *         phoneNumber: "+1234567890"
 *         password: "$2a$10$encryptedpasswordhash"
 *         createdAt: "2024-05-01T12:00:00.000Z"
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - firstName
 *               - lastName
 *               - phoneNumber
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 example: "strongpassword123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing or invalid fields / user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error during registration
 */
userRoutes.post('/register', registerUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with username and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 example: "strongpassword123"
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: JWT token for authenticated requests
 *       400:
 *         description: Invalid credentials or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error during login
 */
userRoutes.post('/login', loginUser);

export default userRoutes;
