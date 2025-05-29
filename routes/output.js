import express from "express";
import { localizeOutput } from '../controllers/output.js';

const outputRoutes = express.Router();

// POST /output/localize
outputRoutes.post('/localize', localizeOutput);

export default outputRoutes;