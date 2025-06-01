import axios from "axios";
import Diagnosis from "../models/diagnosis.js";

const TRANSLATION_URL = process.env.GHANA_TRANSLATION_URL;
const TTS_URL = process.env.GHANA_TTS_URL;
const ASR_URL = process.env.GHANA_ASR_BASE_URL;
const GHANA_NLP_API_KEY = process.env.GHANA_API_KEY;

// Speaker mapping for different languages
const SPEAKER_MAPPING = {
  'tw': ['twi_speaker_4', 'twi_speaker_5', 'twi_speaker_6', 'twi_speaker_7', 'twi_speaker_8', 'twi_speaker_9'],
  'ki': ['kikuyu_speaker_1', 'kikuyu_speaker_5'],
  'ee': ['ewe_speaker_3', 'ewe_speaker_4']
};

// Supported languages for ASR
const ASR_SUPPORTED_LANGUAGES = ['tw', 'gaa', 'dag', 'yo', 'ee', 'ki', 'ha'];

// Get default speaker for a language
const getDefaultSpeaker = (language) => {
  const speakers = SPEAKER_MAPPING[language];
  return speakers ? speakers[0] : null;
};

// New function: Transcribe audio to text using ASR
export const transcribeAudio = async (req, res) => {
  const { language } = req.query;
  
  if (!language) {
    return res.status(400).json({ error: "Language parameter is required." });
  }

  if (!ASR_SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({ 
      error: `Language '${language}' is not supported for ASR.`,
      supportedLanguages: ASR_SUPPORTED_LANGUAGES
    });
  }

  if (!req.file && !req.body.audioData) {
    return res.status(400).json({ error: "Audio file or audio data is required." });
  }

  try {
    let audioBuffer;
    
    // Handle different audio input formats
    if (req.file) {
      // If audio is uploaded as a file
      audioBuffer = req.file.buffer;
    } else if (req.body.audioData) {
      // If audio is sent as base64 data
      const base64Audio = req.body.audioData.replace(/^data:audio\/[^;]+;base64,/, '');
      audioBuffer = Buffer.from(base64Audio, 'base64');
    }

    // Make ASR request to GhanaNLP API
    const asrResponse = await axios.post(`${ASR_URL}?language=${language}`, audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
        'Ocp-Apim-Subscription-Key': GHANA_NLP_API_KEY
      },
      timeout: 30000 // 30 second timeout for audio processing
    });

    const transcribedText = asrResponse.data;

    res.status(200).json({
      message: "Audio transcription completed.",
      transcribedText,
      language,
      originalAudioSize: audioBuffer.length
    });

  } catch (error) {
    console.error("ASR Error:", error.message);
    
    if (error.response) {
      console.error("ASR API Response Error:", error.response.status, error.response.data);
      return res.status(500).json({ 
        error: "ASR API request failed.", 
        details: error.response.status === 401 ? "Invalid API key" : 
                error.response.status === 400 ? "Invalid audio format or language" :
                "ASR service unavailable"
      });
    }
    
    res.status(500).json({ error: "Audio transcription failed." });
  }
};

// Enhanced function: Process audio input, transcribe, then localize output
export const processAudioAndLocalize = async (req, res) => {
  const { language, speakerId } = req.body;
  
  if (!language) {
    return res.status(400).json({ error: "Language parameter is required." });
  }

  if (!ASR_SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({ 
      error: `Language '${language}' is not supported for ASR.`,
      supportedLanguages: ASR_SUPPORTED_LANGUAGES
    });
  }

  if (!req.file && !req.body.audioData) {
    return res.status(400).json({ error: "Audio file or audio data is required." });
  }

  try {
    let audioBuffer;
    
    // Handle different audio input formats
    if (req.file) {
      audioBuffer = req.file.buffer;
    } else if (req.body.audioData) {
      const base64Audio = req.body.audioData.replace(/^data:audio\/[^;]+;base64,/, '');
      audioBuffer = Buffer.from(base64Audio, 'base64');
    }

    // Step 1: Transcribe audio to text
    const asrResponse = await axios.post(`${ASR_URL}?language=${language}`, audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
        'Ocp-Apim-Subscription-Key': GHANA_NLP_API_KEY
      },
      timeout: 30000
    });

    const transcribedText = asrResponse.data;

    // Step 2: Create a diagnosis record with the transcribed text
    const diagnosis = new Diagnosis({
      combinedResult: transcribedText,
      language: language,
      inputMethod: 'audio',
      originalAudioSize: audioBuffer.length
    });
    await diagnosis.save();

    // Step 3: Generate TTS audio if TTS is supported for this language
    let audioURL = null;
    let localizedText = transcribedText;

    if (SPEAKER_MAPPING[language]) {
      const selectedSpeakerId = speakerId || getDefaultSpeaker(language);

      // Generate TTS audio
      const ttsResponse = await axios.post(TTS_URL, {
        text: localizedText,
        language: language,
        speaker_id: selectedSpeakerId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Ocp-Apim-Subscription-Key': GHANA_NLP_API_KEY
        },
        responseType: 'arraybuffer'
      });

      const audioBuffer = Buffer.from(ttsResponse.data);
      const audioBase64 = audioBuffer.toString('base64');
      audioURL = `data:audio/wav;base64,${audioBase64}`;

      // Update diagnosis with audio URL
      diagnosis.audioURL = audioURL;
      await diagnosis.save();
    }

    res.status(200).json({
      message: "Audio processing and localization completed.",
      diagnosisId: diagnosis._id,
      transcribedText,
      localizedText,
      audioURL,
      speakerId: speakerId || getDefaultSpeaker(language),
      language,
      inputMethod: 'audio'
    });

  } catch (error) {
    console.error("Audio Processing Error:", error.message);
    
    if (error.response) {
      console.error("API Response Error:", error.response.status, error.response.data);
      return res.status(500).json({ 
        error: "Audio processing failed.", 
        details: error.response.status === 401 ? "Invalid API key" : 
                error.response.status === 400 ? "Invalid audio format or language" :
                "API service unavailable"
      });
    }
    
    res.status(500).json({ error: "Audio processing failed." });
  }
};

// Original function: Translates diagnosis result into selected local language and generates audio using TTS
export const localizeOutput = async (req, res) => {
  const { diagnosisId, speakerId } = req.body;
  
  if (!diagnosisId) {
    return res.status(400).json({ error: "Diagnosis ID is required." });
  }

  try {
    const diagnosis = await Diagnosis.findById(diagnosisId);
    if (!diagnosis) {
      return res.status(404).json({ error: "Diagnosis not found." });
    }

    // Check if language is supported for TTS
    if (!SPEAKER_MAPPING[diagnosis.language]) {
      return res.status(400).json({ 
        error: `Language '${diagnosis.language}' is not supported for TTS. Supported languages: tw (Twi), ki (Kikuyu), ee (Ewe)` 
      });
    }

    let localizedText = diagnosis.combinedResult;

    // Translate text if translation URL is available and language is not English
    if (TRANSLATION_URL && diagnosis.language !== 'en') {
      try {
        const translationRes = await axios.post(TRANSLATION_URL, {
          in: diagnosis.combinedResult,
          lang: `en-${diagnosis.language}`,
        });
        localizedText = translationRes.data.out;
      } catch (translationError) {
        console.warn("Translation failed, using original text:", translationError.message);
        // Continue with original text if translation fails
      }
    }

    // Determine speaker ID
    const selectedSpeakerId = speakerId || getDefaultSpeaker(diagnosis.language);

    // Generate TTS audio using GhanaNLP API
    const ttsResponse = await axios.post(TTS_URL, {
      text: localizedText,
      language: diagnosis.language,
      speaker_id: selectedSpeakerId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Ocp-Apim-Subscription-Key': GHANA_NLP_API_KEY
      },
      responseType: 'arraybuffer' // Since the API returns WAV audio file
    });

    // Convert audio buffer to base64 or save to file storage
    // For now, we'll create a data URL for the audio
    const audioBuffer = Buffer.from(ttsResponse.data);
    const audioBase64 = audioBuffer.toString('base64');
    const audioURL = `data:audio/wav;base64,${audioBase64}`;

    // Update diagnosis with localized content
    diagnosis.localizedText = localizedText;
    diagnosis.audioURL = audioURL;
    await diagnosis.save();

    res.status(200).json({
      message: "Localization completed.",
      localizedText,
      audioURL,
      speakerId: selectedSpeakerId,
      language: diagnosis.language
    });

  } catch (error) {
    console.error("Localization Error:", error.message);
    
    // Provide more specific error messages
    if (error.response) {
      console.error("API Response Error:", error.response.status, error.response.data);
      return res.status(500).json({ 
        error: "TTS API request failed.", 
        details: error.response.status === 401 ? "Invalid API key" : "API service unavailable"
      });
    }
    
    res.status(500).json({ error: "Localization failed." });
  }
};

// Helper function to get available speakers for a language
export const getAvailableSpeakers = (req, res) => {
  const { language } = req.params;
  
  if (!language) {
    return res.status(400).json({ error: "Language parameter is required." });
  }
  
  const speakers = SPEAKER_MAPPING[language];
  if (!speakers) {
    return res.status(404).json({ 
      error: `Language '${language}' not supported.`,
      supportedLanguages: Object.keys(SPEAKER_MAPPING)
    });
  }
  
  res.status(200).json({
    language,
    availableSpeakers: speakers,
    defaultSpeaker: speakers[0]
  });
};

// Helper function to get supported ASR languages
export const getSupportedASRLanguages = (req, res) => {
  res.status(200).json({
    supportedLanguages: ASR_SUPPORTED_LANGUAGES,
    languageDetails: {
      'tw': 'Twi',
      'gaa': 'Ga', 
      'dag': 'Dagbani',
      'yo': 'Yoruba',
      'ee': 'Ewe',
      'ki': 'Kikuyu',
      'ha': 'Hausa'
    }
  });
};
