import axios from 'axios';
import FormData from 'form-data';

// NLP ASR and Image Model endpoints
const GHANA_ASR_BASE_URL = process.env.GHANA_ASR_BASE_URL ;
const IMAGE_MODEL_URL = process.env.IMAGE_MODEL_URL;

// Supported languages for ASR
const SUPPORTED_LANGUAGES = {
  'tw': 'Twi',
  'gaa': 'Ga', 
  'dag': 'Dagbani',
  'yo': 'Yoruba',
  'ee': 'Ewe',
  'ki': 'Kikuyu',
  'ha': 'Hausa'
};

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

    // ✅ Validate and get language parameter
    const language = req.body.language || req.query.language || 'tw'; // Default to Twi
    
    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({ 
        error: 'Unsupported language',
        message: `Language '${language}' is not supported. Supported languages: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`,
        supportedLanguages: SUPPORTED_LANGUAGES
      });
    }

    console.log('Processing audio file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.buffer.length,
      language: language,
      languageName: SUPPORTED_LANGUAGES[language]
    });

    const audioBuffer = req.file.buffer;
    
    // Construct the API URL with language parameter
    const apiUrl = `${GHANA_ASR_BASE_URL}?language=${language}`;
    
    console.log(`Sending ASR request to: ${apiUrl}`);
    console.log('Request headers:', {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache'
    });

    // Send binary audio data directly to Ghana NLP ASR v2
    const response = await axios.post(apiUrl, audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg', // Fixed content type as per API docs
        'Cache-Control': 'no-cache'
        // Note: No subscription key needed for v2 API
      },
      timeout: 180000, // 3 minutes for longer audio files
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      // Ensure binary data is sent properly
      responseType: 'json'
    });

    console.log('Ghana NLP ASR v2 Response Status:', response.status);
    console.log('Ghana NLP ASR v2 Response:', response.data);

    // Extract transcription from response
    let transcription;
    
    if (typeof response.data === 'string') {
      transcription = response.data;
    } else if (response.data.transcription) {
      transcription = response.data.transcription;
    } else if (response.data.text) {
      transcription = response.data.text;
    } else if (response.data.result) {
      transcription = response.data.result;
    } else {
      transcription = response.data;
    }
    
    if (!transcription || transcription.trim() === '') {
      return res.status(500).json({ 
        error: 'No transcription received from ASR service',
        rawResponse: response.data,
        responseStatus: response.status,
        message: 'The audio might be unclear or in an unsupported format'
      });
    }

    res.status(200).json({ 
      success: true,
      transcription: transcription.toString().trim(),
      language: language,
      languageName: SUPPORTED_LANGUAGES[language],
      audioInfo: {
        originalName: req.file.originalname,
        size: req.file.buffer.length,
        mimeType: req.file.mimetype
      },
      apiVersion: 'v2',
      rawResponse: response.data
    });

  } catch (error) {
    console.error('ASR Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    
    if (error.code === 'ECONNABORTED') {
      res.status(500).json({
        error: 'Request timeout - the speech recognition service is taking too long to respond.',
        details: 'The ASR API might be processing a very long audio file or is overloaded.',
        timeout: '3 minutes',
        suggestion: 'Try with shorter audio files (under 2 minutes) or try again later.'
      });
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      res.status(500).json({
        error: 'Cannot connect to Ghana NLP API',
        details: 'The Ghana NLP service appears to be unreachable.',
        suggestion: 'Please check your internet connection and try again later.',
        apiUrl: `${GHANA_ASR_BASE_URL}?language=${req.body.language || req.query.language || 'tw'}`
      });
    } else if (error.response) {
      console.error('ASR API Response Error:', error.response.data);
      
      let errorMessage = 'Voice transcription failed.';
      let suggestion = 'Please check the audio file format and try again.';
      
      if (error.response.status === 400) {
        errorMessage = 'Bad request - invalid audio format or language.';
        suggestion = 'Ensure audio is in MP3 format and language code is valid.';
      } else if (error.response.status === 413) {
        errorMessage = 'Audio file too large.';
        suggestion = 'Try with a smaller audio file.';
      } else if (error.response.status === 422) {
        errorMessage = 'Audio processing failed.';
        suggestion = 'The audio might be corrupted or in an unsupported format.';
      }
      
      res.status(error.response.status || 500).json({
        error: errorMessage,
        details: error.response.data,
        status: error.response.status,
        suggestion: suggestion
      });
    } else {
      res.status(500).json({ 
        error: 'Voice transcription failed.',
        details: error.message,
        suggestion: 'Please check if the Ghana NLP API is accessible.'
      });
    }
  }
};

// Test endpoint to check Ghana NLP API v2 connectivity
export const testGhanaNLPConnection = async (req, res) => {
  try {
    console.log('Testing Ghana NLP API v2 connection...');
    
    // Test basic connectivity to the domain
    const testResponse = await axios.get('https://translation-api.ghananlp.org', {
      timeout: 10000
    });
    
    console.log('Connection test successful');
    
    res.status(200).json({
      message: 'Ghana NLP API is reachable',
      status: testResponse.status,
      apiVersion: 'v2',
      endpoint: GHANA_ASR_BASE_URL,
      supportedLanguages: SUPPORTED_LANGUAGES,
      features: [
        'Supports longer audio files',
        'No API key required',
        'Binary audio upload',
        'Multiple language support'
      ]
    });
    
  } catch (error) {
    console.error('Connection test failed:', error.message);
    
    res.status(500).json({
      error: 'Cannot connect to Ghana NLP API',
      details: error.message,
      apiVersion: 'v2',
      endpoint: GHANA_ASR_BASE_URL,
      suggestion: 'Check internet connection and API availability'
    });
  }
};

// Handles image uploads by sending files to image prediction API and predicts crop disease from image input
export const handleImageUpload = async (req, res) => {
  try {
    // ✅ Validate file
    // Add environment variable check
    if (!IMAGE_MODEL_URL) {
      return res.status(500).json({
        error: 'Plant disease API not configured',
        message: 'Service configuration error',
        debug: {
          envVarType: typeof IMAGE_MODEL_URL
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

    // Create FormData for image prediction
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'image.jpg',
      contentType: req.file.mimetype
    });

    // Send to plant disease API
    const endpoint = `${IMAGE_MODEL_URL}/predict_image/`;
    console.log(`Sending request to: ${endpoint}`);

    const response = await axios.post(endpoint, formData, {
      headers: {
        ...formData.getHeaders(),
        'accept': 'application/json'
      },
      timeout: 80000
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
        error: 'Request timeout - the image processing service is taking too long to respond.',
        details: 'The external API might be slow or overloaded. Please try again.'
      });
    } else if (error.response) {
      console.error('API Response Error:', error.response.data);
      res.status(500).json({
        error: 'Image classification failed.',
        details: error.response.data,
        status: error.response.status
      });
    } else {
      res.status(500).json({
        error: 'Image classification failed.',
        details: error.message
      });
    }
  }
};

// Helper function to get supported languages
export const getSupportedLanguages = (req, res) => {
  res.status(200).json({
    supportedLanguages: SUPPORTED_LANGUAGES,
    defaultLanguage: 'tw'
  });
};