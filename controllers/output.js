import axios from "axios";
import Diagnosis from "../models/diagnosis.js";

const TRANSLATION_URL = process.env.GHANA_TRANSLATION_URL;
const TTS_URL = process.env.GHANA_TTS_URL;

// export const localizeOutput = async (req, res) => {
//   const { diagnosisId } = req.body;

//   if (!diagnosisId) {
//     return res.status(400).json({ error: "Diagnosis ID is required." });
//   }

//   try {
//     const diagnosis = await Diagnosis.findById(diagnosisId);
//     if (!diagnosis) {
//       return res.status(404).json({ error: "Diagnosis not found." });
//     }

//     // Translate text
//     const translationRes = await axios.post(TRANSLATION_URL, {
//       in: diagnosis.combinedResult,
//       lang: `en-${diagnosis.language}`,
//     });

//     const localizedText = translationRes.data.out;

//     // Generate TTS audio
//     const ttsRes = await axios.post(TTS_URL, {
//       text: localizedText,
//       lang: diagnosis.language,
//     });

//     const audioURL = ttsRes.data.audio_url;

//     // Update diagnosis with localized content
//     diagnosis.localizedText = localizedText;
//     diagnosis.audioURL = audioURL;
//     await diagnosis.save();

//     res.status(200).json({
//       message: "Localization completed.",
//       localizedText,
//       audioURL,
//     });
//   } catch (error) {
//     console.error("Localization Error:", error.message);
//     res.status(500).json({ error: "Localization failed." });
//   }
// };


// Mocking for test purpose (will delete all below, remove comment from functions above after api key)
export const localizeOutput = async (req, res) => {
  const { diagnosisId } = req.body;

  if (!diagnosisId) {
    return res.status(400).json({ error: 'Diagnosis ID is required.' });
  }

  try {
    const diagnosis = await Diagnosis.findById(diagnosisId);
    if (!diagnosis) {
      return res.status(404).json({ error: 'Diagnosis not found.' });
    }

    // 🔄 MOCK RESPONSE
    const localizedText = `Twi: ${diagnosis.combinedResult}`;
    const audioURL = `https://example.com/audio/${diagnosis._id}.mp3`;

    diagnosis.localizedText = localizedText;
    diagnosis.audioURL = audioURL;
    await diagnosis.save();

    res.status(200).json({
      message: 'Localization completed (mock)',
      localizedText,
      audioURL
    });

  } catch (error) {
    console.error('Localization Error:', error.message);
    res.status(500).json({ error: 'Mock localization failed.' });
  }
};
