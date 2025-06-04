import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import uploadRoutes from './routes/upload.js';
import diagnoseRoutes from './routes/diagnose.js';
import outputRoutes from './routes/output.js';
import userRoutes from './routes/user.js';
import { swaggerDocs, swaggerUiSetup } from './config/swagger.js';

dotenv.config();

const okuaniadamfoapp = express();

//  CORS setup: only allow Netlify frontend in production
const allowedOrigins = [
  'https://okuaniadamfo.netlify.app', //  Your frontend
  'http://localhost:5173',            //  Dev frontend (optional)
];

okuaniadamfoapp.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed from this origin: ' + origin), false);
  },
  credentials: true
}));

// Body parsers
okuaniadamfoapp.use(express.json({ limit: '50mb' }));
okuaniadamfoapp.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
okuaniadamfoapp.use('/upload', uploadRoutes);
okuaniadamfoapp.use('/', diagnoseRoutes);
okuaniadamfoapp.use('/output', outputRoutes);
okuaniadamfoapp.use('/auth', userRoutes);

// Swagger Docs
okuaniadamfoapp.use('/api-docs', swaggerDocs, swaggerUiSetup);

//  Redirect root to docs
okuaniadamfoapp.get('/', (req, res) => {
  res.redirect('/api-docs');
});

//  Connect to DB and start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' MongoDB connected');

    const port = process.env.PORT || 8080;
    okuaniadamfoapp.listen(port, () => {
      console.log(`OkuaniAdamfo App running on port ${port}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

startServer();
