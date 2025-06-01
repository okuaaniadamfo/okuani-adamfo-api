import axios from "axios";
import Diagnosis from "../models/diagnosis.js";

const TRANSLATION_URL = process.env.GHANA_TRANSLATION_URL;
const TTS_URL = process.env.GHANA_TTS_URL;
const GHANA_NLP_API_KEY = process.env.GHANA_API_KEY;

// Speaker mapping for different languages
const SPEAKER_MAPPING = {
  'tw': ['twi_speaker_4', 'twi_speaker_5', 'twi_speaker_6', 'twi_speaker_7', 'twi_speaker_8', 'twi_speaker_9'],
  'ki': ['kikuyu_speaker_1', 'kikuyu_speaker_5'],
  'ee': ['ewe_speaker_3', 'ewe_speaker_4']
};

// Get default speaker for a language
const getDefaultSpeaker = (language) => {
  const speakers = SPEAKER_MAPPING[language];
  return speakers ? speakers[0] : null;
};

// Translates diagnosis result into selected local language and generates audio using TTS
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
