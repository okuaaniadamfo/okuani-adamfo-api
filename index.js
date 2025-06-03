import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRoutes from "./routes/upload.js";
import diagnoseRoutes from "./routes/diagnose.js";
import outputRoutes from "./routes/output.js";
import { swaggerDocs, swaggerUiSetup } from "./config/swagger.js";
import userRoutes from "./routes/user.js";
import swaggerUi from 'swagger-ui-express'; // Add this import

dotenv.config();

// Debug environment variables
console.log('Environment Variables:', {
  IMAGE_MODEL_URL: process.env.IMAGE_MODEL_URL ? 'Set' : 'Missing',
  GHANA_API_KEY: process.env.GHANA_API_KEY ? 'Set' : 'Missing',
  MONGO_URI: process.env.MONGO_URI ? 'Set' : 'Missing'
});

// Create express app
const app = express();

// Enhanced CORS configuration
const allowedOrigins = [
  'https://okuaniadamfo.netlify.app',
  'http://localhost:3000',
  'http://localhost:5000'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('Blocked CORS request from origin:', origin);
    return callback(new Error(`Origin '${origin}' not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Initialize routes
app.use('/upload', uploadRoutes);
app.use('/', diagnoseRoutes);
app.use('/output', outputRoutes);
app.use('/auth', userRoutes);

// Swagger documentation - Updated this line
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    mongo: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('MongoDB connected successfully');
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
};

startServer();