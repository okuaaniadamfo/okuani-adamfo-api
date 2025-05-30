import axios from 'axios';

// NLP ASR and Image Model endpoints
const GHANA_ASR_URL = process.env.GHANA_ASR_URL;
const IMAGE_MODEL_URL = process.env.IMAGE_MODEL_URL;

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
    // ✅ Validate file
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Invalid image file format.' });
    }

    const imageBuffer = req.file.buffer;

    const response = await axios.post(IMAGE_MODEL_URL, imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
      }
    });

    const prediction = response.data.prediction;
    res.status(200).json({ prediction });
  } catch (error) {
    console.error('Image Processing Error:', error.message);
    res.status(500).json({ error: 'Image classification failed.' });
  }
};


