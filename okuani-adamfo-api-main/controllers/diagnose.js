import Diagnosis from "../models/diagnosis.js";
import axios from "axios";

// Google Custom Search API configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

// Function to search Google for treatment information
const searchTreatmentInfo = async (query) => {
  try {
    const searchQuery = `${query} treatment prevention agriculture farming Ghana`;
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_SEARCH_ENGINE_ID,
        q: searchQuery,
        num: 5, // Get top 5 results
        safe: 'active'
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items.map(item => ({
        title: item.title,
        snippet: item.snippet,
        link: item.link
      }));
    }
    return [];
  } catch (error) {
    console.error('Google Search Error:', error.message);
    return [];
  }
};

// Function to generate treatment recommendations from search results
const generateTreatmentRecommendations = (searchResults, diseaseInfo) => {
  if (searchResults.length === 0) {
    return `Based on the identified condition: ${diseaseInfo}, here are general recommendations:
    
1. **Immediate Action**: Remove affected plant parts and dispose of them properly
2. **Prevention**: Ensure proper spacing between plants for air circulation
3. **Treatment**: Consider organic fungicides or pesticides appropriate for the condition
4. **Monitoring**: Check plants regularly for early detection
5. **Soil Management**: Ensure proper drainage and soil health

Please consult with local agricultural extension officers for specific treatment options available in your area.`;
  }

  let recommendations = `**Treatment Recommendations for ${diseaseInfo}:**\n\n`;
  
  searchResults.forEach((result, index) => {
    recommendations += `**${index + 1}. ${result.title}**\n`;
    recommendations += `${result.snippet}\n`;
    recommendations += `Source: ${result.link}\n\n`;
  });

  recommendations += `\n**Additional Recommendations:**\n`;
  recommendations += `• Consult local agricultural extension services\n`;
  recommendations += `• Consider integrated pest management approaches\n`;
  recommendations += `• Monitor weather conditions that may worsen the condition\n`;
  recommendations += `• Keep records of treatments applied for future reference`;

  return recommendations;
};

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
    let searchQuery = "";

    if (voiceInput && imageResult) {
      combinedResult = `Symptoms reported: ${voiceInput}. Visual analysis suggests: ${imageResult}.`;
      searchQuery = `${voiceInput} ${imageResult}`;
    } else if (voiceInput) {
      combinedResult = `Symptoms reported: ${voiceInput}. Awaiting image input for complete diagnosis.`;
      searchQuery = voiceInput;
    } else {
      combinedResult = `Visual analysis suggests: ${imageResult}. No additional symptoms reported.`;
      searchQuery = imageResult;
    }

    console.log('Searching for treatment information...');
    
    // Search for treatment information
    const searchResults = await searchTreatmentInfo(searchQuery);
    
    // Generate comprehensive treatment recommendations
    const treatmentRecommendations = generateTreatmentRecommendations(
      searchResults, 
      imageResult || voiceInput
    );

    // Create comprehensive diagnosis result
    const comprehensiveDiagnosis = `${combinedResult}\n\n${treatmentRecommendations}`;

    const newDiagnosis = new Diagnosis({
      voiceInput,
      imageResult,
      combinedResult: comprehensiveDiagnosis,
      language,
      searchResults: searchResults, // Store search results for reference
      treatmentRecommendations,
      createdAt: new Date()
    });

    await newDiagnosis.save();

    res.status(201).json({
      message: "Comprehensive diagnosis created successfully.",
      diagnosis: {
        id: newDiagnosis._id,
        voiceInput: newDiagnosis.voiceInput,
        imageResult: newDiagnosis.imageResult,
        combinedResult: newDiagnosis.combinedResult,
        treatmentRecommendations: newDiagnosis.treatmentRecommendations,
        language: newDiagnosis.language,
        searchResultsCount: searchResults.length,
        createdAt: newDiagnosis.createdAt
      }
    });
  } catch (error) {
    console.error("Diagnosis creation error:", error.message);
    res.status(500).json({ 
      error: "Failed to create diagnosis.",
      details: error.message 
    });
  }
};

// New endpoint to get detailed diagnosis by ID
export const getDiagnosisById = async (req, res) => {
  const { id } = req.params;

  try {
    const diagnosis = await Diagnosis.findById(id);
    
    if (!diagnosis) {
      return res.status(404).json({ error: "Diagnosis not found." });
    }

    res.status(200).json({
      message: "Diagnosis retrieved successfully.",
      diagnosis
    });
  } catch (error) {
    console.error("Get diagnosis error:", error.message);
    res.status(500).json({ 
      error: "Failed to retrieve diagnosis.",
      details: error.message 
    });
  }
};

// New endpoint to get user's diagnosis history
export const getUserDiagnosisHistory = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const diagnoses = await Diagnosis.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Diagnosis.countDocuments({ userId });

    res.status(200).json({
      message: "Diagnosis history retrieved successfully.",
      diagnoses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error("Get diagnosis history error:", error.message);
    res.status(500).json({ 
      error: "Failed to retrieve diagnosis history.",
      details: error.message 
    });
  }
};
