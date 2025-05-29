import axios from 'axios';

// Simulated Ghana NLP ASR and Image Model endpoints (replace with actual URLs)
const GHANA_ASR_URL = process.env.GHANA_ASR_URL;
const IMAGE_MODEL_URL = process.env.IMAGE_MODEL_URL;

// export const handleVoiceUpload = async (req, res) => {
//   try {
//     const audioBuffer = req.file.buffer;

//     const response = await axios.post(GHANA_ASR_URL, audioBuffer, {
//       headers: {
//         'Content-Type': 'audio/wav',
//         'Authorization': `Bearer ${process.env.GHANA_API_KEY}`
//       }
//     });

//     const transcription = response.data.transcription;
//     res.status(200).json({ transcription });
//   } catch (error) {
//     console.error('ASR Error:', error.message);
//     res.status(500).json({ error: 'Voice transcription failed.' });
//   }
// };

// export const handleImageUpload = async (req, res) => {
//   try {
//     const imageBuffer = req.file.buffer;

//     const response = await axios.post(IMAGE_MODEL_URL, imageBuffer, {
//       headers: {
//         'Content-Type': 'image/jpeg',
//       }
//     });

//     const prediction = response.data.prediction;
//     res.status(200).json({ prediction });
//   } catch (error) {
//     console.error('Image Processing Error:', error.message);
//     res.status(500).json({ error: 'Image classification failed.' });
//   }
// };


// Mocking for test purpose (will delete all below, remove comment from functions above after adding api key)
export const handleVoiceUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 🔄 MOCK RESPONSE
    const transcription = 'My maize leaves are yellow';
    res.status(200).json({ transcription });

  } catch (error) {
    res.status(500).json({ error: 'Mock ASR error' });
  }
  console.log('Received audio:', req.file);
};

export const handleImageUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // 🔄 MOCK RESPONSE
    const prediction = 'Maize leaf blight';
    res.status(200).json({ prediction });

  } catch (error) {
    res.status(500).json({ error: 'Mock image upload error' });
  }
};

