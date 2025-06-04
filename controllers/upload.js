import axios from 'axios';
import FormData from 'form-data';
import { GhanaNLP } from '@paakways/ghananlp-node';
import 'dotenv/config';

// Initialize the GhanaNLP client
const ghanaNLPClient = new GhanaNLP(process.env.GHANA_API_KEY);

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


/**
 * Converts text to speech using GhanaNLP TTS API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const localizeLanguage = async (req, res) => {
  try {
    // Validate required fields
    const { text, language, speaker_id } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: 'Text is required for text-to-speech conversion',
        example: {
          text: "Hello world",
          language: "tw",
          speaker_id: "twi_speaker_4"
        }
      });
    }

    // Set default language if not provided
    const lang = language || 'tw';
    const speaker = speaker_id || `twi_speaker_${Math.floor(Math.random() * 4) + 1}`;

    // Validate language is supported
    if (!supportedLanguages[lang]) {
      return res.status(400).json({
        error: `Unsupported language: ${lang}`,
        supportedLanguages,
        message: 'Please use one of the supported language codes'
      });
    }

    console.log('Text-to-speech request:', {
      textLength: text.length,
      language: lang,
      speaker_id: speaker
    });

    // Prepare request body for GhanaNLP API
    const body = {
      text: text,
      language: lang,
      speaker_id: speaker
    };

    // Call GhanaNLP TTS API
    const response = await fetch('https://translation-api.ghananlp.org/tts/v1/synthesize', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Ocp-Apim-Subscription-Key': process.env.GHANA_API_KEY,
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`GhanaNLP TTS API error: ${response.status} - ${errorData}`);
    }

    // Get the audio data (assuming it returns binary audio data)
    const audioData = await response.arrayBuffer();

    // Convert ArrayBuffer to Base64 for easier transmission
    const audioBase64 = Buffer.from(audioData).toString('base64');

    res.status(200).json({
      success: true,
      audio: audioBase64,
      format: 'audio/mpeg', // Assuming MP3 format
      language: lang,
      speaker_id: speaker,
      text_length: text.length
    });

  } catch (error) {
    console.error('Text-to-speech conversion error:', error);

    // Handle specific error types
    if (error.message.includes('API key')) {
      return res.status(401).json({
        error: 'Invalid API key',
        details: 'Please check your Ghana NLP API key configuration'
      });
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Cannot connect to Ghana NLP TTS API',
        suggestion: 'Please check if the Ghana NLP API is accessible.'
      });
    }

    res.status(500).json({
      error: 'Text-to-speech conversion failed.',
      details: error.message || 'Unknown error occurred',
      suggestion: 'Please check your request parameters and try again.'
    });
  }
};


/**
 * Converts plant disease solutions from image prediction to audio
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const convertSolutionsToAudio = async (req, res) => {
  try {
    const { prediction, language, speaker_id } = req.body;

    // Validate required prediction data
    if (!prediction || !prediction.raw_response || !prediction.raw_response.solutions) {
      return res.status(400).json({
        error: 'Invalid prediction data format',
        message: 'The request must include prediction data with solutions from /upload/image',
        example: {
          prediction: {
            raw_response: {
              solutions: [
                "Plant resistant varieties",
                "Use crop rotation",
                "Apply fungicides when needed"
              ]
            }
          },
          language: "tw",
          speaker_id: "twi_speaker_4"
        }
      });
    }

    // Extract solutions and clean them (remove markdown formatting like **)
    const rawSolutions = prediction.raw_response.solutions;
    const cleanedSolutions = rawSolutions.map(solution => 
      solution.replace(/\*\*/g, '').replace(/^\s*-\s*/, '').trim()
    );

    // Set default language if not provided
    const lang = language || 'tw';
    const speaker = speaker_id || `twi_speaker_${Math.floor(Math.random() * 4) + 1}`;

    // Validate language is supported
    if (!supportedLanguages[lang]) {
      return res.status(400).json({
        error: `Unsupported language: ${lang}`,
        supportedLanguages,
        message: 'Please use one of the supported language codes'
      });
    }

    // Combine all solutions into one text with natural pauses
    const combinedText = cleanedSolutions.join('. Next solution: ');

    console.log('Converting disease solutions to audio:', {
      disease: prediction.disease,
      solutionCount: cleanedSolutions.length,
      language: lang,
      speaker_id: speaker
    });

    // Prepare request body for GhanaNLP API
    const body = {
      text: `Solutions for ${prediction.disease}. ${combinedText}`,
      language: lang,
      speaker_id: speaker
    };

    // Call GhanaNLP TTS API
    const response = await fetch('https://translation-api.ghananlp.org/tts/v1/synthesize', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Ocp-Apim-Subscription-Key': process.env.GHANA_API_KEY ,
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`GhanaNLP TTS API error: ${response.status} - ${errorData}`);
    }

    // Get the audio data
    const audioData = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioData).toString('base64');

    res.status(200).json({
      success: true,
      audio: audioBase64,
      format: 'audio/mpeg',
      language: lang,
      speaker_id: speaker,
      disease: prediction.disease,
      solution_count: cleanedSolutions.length,
      text_length: combinedText.length
    });

  } catch (error) {
    console.error('Solutions to audio conversion error:', error);
    res.status(500).json({
      error: 'Failed to convert solutions to audio',
      details: error.message || 'Unknown error occurred',
      suggestion: 'Please check your prediction data format and try again.'
    });
  }
};


/**
 * Translates input English text into selected Ghanaian language using GhanaNLP API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadText = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    // Validate input
    if (!text || !targetLanguage) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Both "text" and "targetLanguage" (e.g. tw, gaa, dag, ee) are required.'
      });
    }

    // Validate language is supported
    if (!supportedLanguages[targetLanguage]) {
      return res.status(400).json({
        error: `Unsupported target language: ${targetLanguage}`,
        supportedLanguages,
        message: 'Please use one of the supported language codes'
      });
    }

    // Prepare payload for the GhanaNLP translation API
    const body = {
      in: text,
      lang: `en-${targetLanguage}`
    };

    console.log(`Translating text: "${text}" -> ${body.lang}`);

    // Make POST request to the GhanaNLP translation API
 
    const response = await fetch('https://translation-api.ghananlp.org/v1/translate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Ocp-Apim-Subscription-Key': process.env.GHANA_API_KEY
      }
    });
    // Handle non-successful responses
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: 'Translation API Error',
        details: errorData
      });
    }

    const translatedText = await response.text(); // API returns plain string

    return res.status(200).json({
      originalText: text,
      translatedText,
      targetLanguage: supportedLanguages[targetLanguage],
      langCode: targetLanguage
    });

  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({
      error: 'Translation failed',
      message: error.message || 'Unknown error occurred'
    });
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