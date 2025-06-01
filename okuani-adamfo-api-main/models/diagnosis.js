import mongoose from 'mongoose';

const diagnosisSchema = new mongoose.Schema({
  voiceInput: { type: String, default: null },
  imageResult: { type: String, default: null },
  combinedResult: { type: String, required: true },
  localizedText: { type: String, default: null },
  audioURL: { type: String, default: null },
  language: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Diagnosis = mongoose.model('Diagnosis', diagnosisSchema);

export default Diagnosis;