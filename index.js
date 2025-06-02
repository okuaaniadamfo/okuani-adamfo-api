import dotenv from 'dotenv';
import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import uploadRoutes from "./routes/upload.js";
import diagnoseRoutes from "./routes/diagnose.js";
import outputRoutes from "./routes/output.js";
import { swaggerDocs, swaggerUiSetup } from "./config/swagger.js";
import userRoutes from "./routes/user.js";
dotenv.config();

// Debug: Check if IMAGE_MODEL_URL is loaded
console.log('IMAGE_MODEL_URL:', process.env.IMAGE_MODEL_URL);
console.log('All environment variables:', Object.keys(process.env));
console.log('GHANA_API_KEY exists:', 'GHANA_API_KEY' in process.env);

// create express app
const okuaniadamfoapp = express();

// Configure CORS
const allowedOrigins = [
  'https://okuaniadamfo.netlify.app',
  'http://localhost:5000', // For local development
  'http://localhost:3000', // For local development
  'http://127.0.0.1:3000' // Alternative localhost
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
};

// Apply middleware
okuaniadamfoapp.use(cors(corsOptions));
okuaniadamfoapp.use(express.json({ limit: "50mb" }));
okuaniadamfoapp.use(express.urlencoded({ limit: "50mb", extended: true }));

// Security headers
okuaniadamfoapp.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes
okuaniadamfoapp.use('/upload', uploadRoutes);
okuaniadamfoapp.use('/', diagnoseRoutes);
okuaniadamfoapp.use('/output', outputRoutes);
okuaniadamfoapp.use('/auth', userRoutes);

// Redirect root path to /api-docs
okuaniadamfoapp.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Setup Swagger UI
okuaniadamfoapp.use('/api-docs', swaggerDocs, swaggerUiSetup);

// Error handling for undefined routes
okuaniadamfoapp.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const port = process.env.PORT || 8080;
    okuaniadamfoapp.listen(port, () => {
      console.log(`OkuaniAdamfo App listening on port ${port}`);
      console.log(`CORS allowed for origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

startServer();