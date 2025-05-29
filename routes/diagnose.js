import express from "express";
import { createDiagnosis } from '../controllers/diagnose.js';

const diagnoseRoutes = express.Router();

// POST /diagnose
diagnoseRoutes.post('/', createDiagnosis);

export default diagnoseRoutes;