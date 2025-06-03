import axios from 'axios';
import FormData from 'form-data';
import { GhanaNLP } from '@paakways/ghananlp-node';
import 'dotenv/config';

// Initialize the GhanaNLP client
const ghanaNLPClient = new GhanaNLP(process.env.GHANA_API_KEY);

// const apiKey = process.env.GHANA_API_KEY || '816b752141044d96975ac20f3f0bd101';
// console.log('Using API key:', apiKey);
// const ghanaNLPClient = new GhanaNLP(apiKey);
// console.log('GHANA_API_KEY at controller:', process.env.GHANA_API_KEY);


// Supported languages mapping
const supportedLanguages = {
  tw: 'Twi',
  gaa: 'Ga',
  dag: 'Dagbani',
  yo: 'Yoruba',
  ee: 'Ewe',
  ki: 'Kikuyu',
  ha: 'Hausa'
};

// Voice Upload Handler
export const handleVoiceUpload = async (req, res) => {
  try {
    // Check if API key is configured
    if (!process.env.GHANA_API_KEY) {
      return res.status(500).json({
        error: 'Ghana NLP API not configured',
        message: 'API key is missing',
        debug: {
          envVarType: typeof process.env.GHANA_API_KEY
        }
      });
    }

    // Validate audio file
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ 
        error: 'No audio file uploaded.',
        supportedLanguages 
      });
    }

    // Get language from request (form data or query parameter)
    const language = req.body.language || req.query.language || 'tw';

    // Validate language
    if (!supportedLanguages[language]) {
      return res.status(400).json({
        error: `Unsupported language: ${language}`,
        supportedLanguages,
        message: 'Please use one of the supported language codes'
      });
    }

    console.log('Audio file info:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.buffer.length,
      language: language
    });

    // Prepare ASR request
    const asrRequest = {
      language: language,
      audioFile: req.file.buffer
    };

    console.log(`Transcribing audio in language: ${language} (${supportedLanguages[language]})`);

    // Call Ghana NLP ASR API using the package
    const response = await ghanaNLPClient.transcribeAudio(asrRequest);

    console.log('Ghana NLP ASR Response:', response);

    // Format the response
    const result = {
      transcription: response.transcribedText || response.text || '',
      language: language,
      languageName: supportedLanguages[language],
      confidence: response.confidence || null,
      duration: response.duration || null,
      rawResponse: response
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('Voice transcription error:', error);

    // Handle specific error types
    if (error.message && error.message.includes('API key')) {
      return res.status(401).json({
        error: 'Invalid API key',
        details: 'Please check your Ghana NLP API key configuration'
      });
    }

    if (error.message && error.message.includes('network')) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Cannot connect to Ghana NLP API',
        suggestion: 'Please check if the Ghana NLP API is accessible.'
      });
    }

    res.status(500).json({
      error: 'Voice transcription failed.',
      details: error.message || 'Unknown error occurred',
      suggestion: 'Please check if the Ghana NLP API is accessible.'
    });
  }
};

// Handles image uploads by sending files to image prediction API and predicts crop disease from image input
export const handleImageUpload = async (req, res) => {
  // ✅ Validate file
  try {
    // Check environment variable
    if (!process.env.IMAGE_MODEL_URL) {
      return res.status(500).json({
        error: 'Plant disease API not configured',
        message: 'Service configuration error',
        debug: {
          envVarType: typeof process.env.IMAGE_MODEL_URL
        }
      });
    }

    // Validate file
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Invalid image file format.' });
    }

    console.log('Image file info:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.buffer.length
    });

    // Create FormData for the external API
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'image.jpg',
      contentType: req.file.mimetype
    });

    // Send to plant disease API
    const endpoint = `${process.env.IMAGE_MODEL_URL}/predict/`;
    console.log(`Sending request to: ${endpoint}`);

    const response = await axios.post(endpoint, formData, {
      headers: {
        ...formData.getHeaders(),
        'accept': 'application/json'
      },
      timeout: 80000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('Plant Disease API Response:', response.data);

    // Extract prediction data
    const {
      filename,
      prediction_index,
      predicted_class,
      confidence
    } = response.data;

    // Format the prediction result
    const prediction = {
      disease: predicted_class,
      confidence: Math.round(confidence * 100),
      filename: filename,
      predictionIndex: prediction_index,
      raw_response: response.data
    };

    res.status(200).json({
      success: true,
      prediction
    });

  } catch (error) {
    console.error('Image Processing Error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      res.status(500).json({
        error: 'Request timeout',
        details: 'The external API is taking too long to respond.'
      });
    } else if (error.response) {
      console.error('API Response Error:', error.response.data);
      res.status(500).json({
        error: 'Image classification failed',
        details: error.response.data,
        status: error.response.status
      });
    } else {
      res.status(500).json({
        error: 'Image classification failed',
        details: error.message
      });
    }
  }
};

// Get Supported Languages
export const getSupportedLanguages = async (req, res) => {
  try {
    // You can also get languages from the API
    const languages = await ghanaNLPClient.getLanguages();
    
    res.status(200).json({
      supportedLanguages,
      defaultLanguage: 'tw',
      apiLanguages: languages // Languages from the API
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    
    // Fallback to hardcoded languages
    res.status(200).json({
      supportedLanguages,
      defaultLanguage: 'tw',
      note: 'Using cached language list due to API error'
    });
  }
};

// Test Ghana NLP Connection
export const testGhanaNLPConnection = async (req, res) => {
  try {
    if (!process.env.GHANA_API_KEY) {
      return res.status(500).json({
        error: 'Ghana NLP API key not configured',
        configured: false
      });
    }

    // Test connection by getting supported languages
    const languages = await ghanaNLPClient.getLanguages();
    
    res.status(200).json({
      message: 'Ghana NLP API connection successful',
      configured: true,
      apiKeyPresent: !!process.env.GHANA_API_KEY,
      languagesCount: Object.keys(languages || {}).length
    });
  } catch (error) {
    console.error('Ghana NLP connection test failed:', error);
    
    res.status(500).json({
      error: 'Cannot connect to Ghana NLP API',
      details: error.message,
      configured: !!process.env.GHANA_API_KEY,
      suggestion: 'Check your API key and internet connection'
    });
  }
};