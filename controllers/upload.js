import axios from 'axios';
import FormData from 'form-data';

// NLP ASR and Image Model endpoints
const GHANA_ASR_URL = process.env.GHANA_ASR_URL;

// Handles voice uploads and transcribes voice using Ghana NLP ASR 
export const handleVoiceUpload = async (req, res) => {
  try {
    // ✅ Validate file
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    if (!req.file.mimetype.startsWith('audio/')) {
      return res.status(400).json({ error: 'Invalid audio file format.' });
    }

    const audioBuffer = req.file.buffer;

    const response = await axios.post(GHANA_ASR_URL, audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Authorization': `Bearer ${process.env.GHANA_API_KEY}`
      }
    });

    const transcription = response.data.transcription;
    res.status(200).json({ transcription });
  } catch (error) {
    console.error('ASR Error:', error.message);
    res.status(500).json({ error: 'Voice transcription failed.' });
  }
};

// Handles image uploads by sending files to image prediction API and predicts crop disease from image input
export const handleImageUpload = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(process.env.IMAGE_MODEL_URL, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    // Extract the relevant fields from the API response
    const {
      filename,
      prediction_index,
      predicted_class,
      confidence
    } = response.data;

    res.status(200).json({
      filename,
      prediction_index,
      predicted_class,
      confidence
    });
  } catch (error) {
    console.error('Image Processing Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Image classification failed.' });
  }
};