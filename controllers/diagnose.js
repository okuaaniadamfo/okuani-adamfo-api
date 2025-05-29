import Diagnosis from "../models/diagnosis.js";

export const createDiagnosis = async (req, res) => {
  const { voiceInput, imageResult, language } = req.body;

  if (!imageResult && !voiceInput) {
    return res
      .status(400)
      .json({ error: "Either voiceInput or imageResult must be provided." });
  }

  try {
    // Combine logic: use whichever is available
    let combinedResult = "";

    if (voiceInput && imageResult) {
      combinedResult = `Symptoms reported: ${voiceInput}. Visual analysis suggests: ${imageResult}.`;
    } else if (voiceInput) {
      combinedResult = `Symptoms reported: ${voiceInput}. Awaiting image input.`;
    } else {
      combinedResult = `Visual analysis suggests: ${imageResult}. Awaiting verbal symptoms.`;
    }

    const newDiagnosis = new Diagnosis({
      voiceInput,
      imageResult,
      combinedResult,
      language,
    });

    await newDiagnosis.save();

    res.status(201).json({
      message: "Diagnosis created successfully.",
      diagnosis: newDiagnosis,
    });
  } catch (error) {
    console.error("Diagnosis creation error:", error.message);
    res.status(500).json({ error: "Failed to create diagnosis." });
  }
};
