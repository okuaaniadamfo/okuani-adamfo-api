import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRoutes from "./routes/upload.js";
import diagnoseRoutes from "./routes/diagnose.js";
import outputRoutes from "./routes/output.js";

dotenv.config();

// create express app
const okuaniadamfuapp = express();

// Apply middleware
okuaniadamfuapp.use(cors({ credentials: true, origin: '*' }));
okuaniadamfuapp.use(express.json({ limit: "50mb" }));
okuaniadamfuapp.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
okuaniadamfuapp.use('/upload', uploadRoutes);
okuaniadamfuapp.use('/diagnose', diagnoseRoutes);
okuaniadamfuapp.use('/output', outputRoutes);

// DB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Listen for incoming requests
const port = process.env.PORT || 8080;
okuaniadamfuapp.listen(port, () => {
  console.log(`OkuaniAdamfu App listening on port ${port}`);
});
