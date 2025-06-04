import dotenv from 'dotenv';
import cors from 'cors';
import express from "express";
import mongoose from "mongoose";
import uploadRoutes from "./routes/upload.js";
import diagnoseRoutes from "./routes/diagnose.js";
import outputRoutes from "./routes/output.js";
import { swaggerDocs, swaggerUiSetup } from "./config/swagger.js";
import userRoutes from "./routes/user.js";
dotenv.config();

// create express app
const okuaniadamfoapp = express();

// Apply middleware
// okuaniadamfoapp.use(cors({
//   origin: 'https://okuaniadamfo.netlify.app/',
//   credentials: true
// }));

okuaniadamfoapp.use(cors({ origin: '*' }));
okuaniadamfoapp.use(express.json({ limit: "50mb" }));
okuaniadamfoapp.use(express.urlencoded({ limit: "50mb", extended: true }));

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

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const port = process.env.PORT || 8080;
    okuaniadamfoapp.listen(port, () => {
      console.log(`OkuaniAdamfo App listening on port ${port}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit app if DB connection fails
  }
};

startServer();