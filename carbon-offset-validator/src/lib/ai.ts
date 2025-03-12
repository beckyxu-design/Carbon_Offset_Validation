
import { pipeline } from '@huggingface/transformers';
import { AIAnalysisRequest, AIAnalysisResponse } from './types';
import { toast } from 'sonner';

// Function to handle file uploads (mock implementation)
export const uploadFile = async (file: File): Promise<string> => {
  // In a real app, this would upload to a server and return a URL
  // Here we're just creating a fake URL for demonstration
  console.log("Uploading file:", file.name);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a dummy URL
  return `https://example.com/uploads/${file.name}`;
};

// Sample project data to simulate AI responses
const sampleProjectData = {
  "project-001": {
    id: "project-001",
    name: "Amazon Forest Conservation",
    location: "Brazil",
    size: "10,000 hectares",
    startDate: "2022-01-15",
    description: "Conservation project focused on preventing deforestation in the Amazon rainforest."
  },
  "project-002": {
    id: "project-002",
    name: "Congo Basin Protection",
    location: "Democratic Republic of Congo",
    size: "8,500 hectares", 
    startDate: "2021-05-20",
    description: "Project aimed at protecting the Congo Basin rainforest from illegal logging and land conversion."
  },
  "project-003": {
    id: "project-003",
    name: "Borneo Peatland Restoration",
    location: "Indonesia",
    size: "5,200 hectares",
    startDate: "2022-08-10", 
    description: "Restoration of degraded peatlands in Borneo to prevent carbon emissions and protect biodiversity."
  }
};

// Generate sample deforestation data
const generateSampleDeforestationData = (years = 10, startHectares = 1000, decreaseRate = 0.97) => {
  const data = [];
  let hectares = startHectares;
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < years; i++) {
    data.push({
      year: currentYear - (years - i - 1),
      hectares: Math.round(hectares)
    });
    hectares *= decreaseRate; // simulate reduction each year
  }
  
  return data;
};

// Generate sample emissions data
const generateSampleEmissionsData = (years = 10, startTonnes = 5000, decreaseRate = 0.95) => {
  const data = [];
  let tonnes = startTonnes;
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < years; i++) {
    data.push({
      year: currentYear - (years - i - 1),
      tonnes: Math.round(tonnes)
    });
    tonnes *= decreaseRate; // simulate reduction each year
  }
  
  return data;
};

// Generate sample risk factors
const generateSampleRiskFactors = () => {
  return [
    {
      name: "Leakage",
      score: Math.floor(Math.random() * 60) + 20, // 20-80
      description: "Risk of deforestation activities shifting to areas outside the project boundaries."
    },
    {
      name: "Permanence",
      score: Math.floor(Math.random() * 50) + 30, // 30-80
      description: "Risk that carbon benefits may not be sustained over time due to natural disasters or human activities."
    },
    {
      name: "Baseline Overestimation",
      score: Math.floor(Math.random() * 70) + 10, // 10-80
      description: "Risk that the baseline scenario overestimates the rate of deforestation that would occur in the absence of the project."
    },
    {
      name: "Additionality",
      score: Math.floor(Math.random() * 60) + 20, // 20-80
      description: "Risk that the project activities would have occurred anyway without carbon finance."
    }
  ];
};

// Generate sample analysis result including recommendations
const generateSampleAnalysisResult = (query: string) => {
  return {
    summary: `This project demonstrates moderate to high effectiveness in reducing deforestation in the target area. However, there are some concerns about leakage effects and the accuracy of the baseline scenario. The project has established reasonable monitoring protocols but could benefit from improved community engagement to ensure long-term sustainability.`,
    riskFactors: generateSampleRiskFactors(),
    recommendations: [
      "Implement a buffer zone around the project area to mitigate leakage risks.",
      "Enhance community engagement through benefit-sharing mechanisms.",
      "Improve monitoring technology to track forest changes more accurately.",
      "Diversify project activities to address multiple drivers of deforestation.",
      "Establish a contingency fund for addressing unexpected threats to permanence."
    ],
    additionalInsights: `The project area shows signs of recovery in previously degraded sections, particularly in the northern region. Satellite imagery confirms an increase in vegetation density over the past three years. Local species diversity appears to be stabilizing based on limited monitoring data.`
  };
};

// Simulate AI processing with a delay
export const processQuery = async (request: AIAnalysisRequest): Promise<AIAnalysisResponse> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Extract project ID and query
    const { projectId, query } = request;
    
    // Get project data or use default if not found
    const projectData = sampleProjectData[projectId as keyof typeof sampleProjectData] || {
      id: projectId,
      name: `Project ${projectId}`,
      location: "Unknown Location",
      size: "Unknown Size",
      startDate: "N/A",
      description: "No description available."
    };
    
    // Generate analysis response
    const analysisResult = generateSampleAnalysisResult(query);
    
    // Generate sample data for visualizations
    const deforestationData = generateSampleDeforestationData();
    const emissionsData = generateSampleEmissionsData();
    
    // Attempt to use HuggingFace transformers to process the query
    let queryResponse = "";
    
    try {
      // Initialize the pipeline
      const generator = await pipeline('text-generation', 'distilgpt2');
      
      // Generate text based on the query
      const result = await generator(query, {
        max_length: 100,
        temperature: 0.7,
        num_return_sequences: 1
      });
      
      // Get the generated text - fixed to handle different response types
      if (Array.isArray(result)) {
        queryResponse = result[0].generated_text || 'No response generated';
      } else {
        queryResponse = result.generated_text || 'No response generated';
      }
      
      // Add some context to make it more relevant to carbon projects
      queryResponse = `Based on analysis of the project data: ${queryResponse}`;
      
    } catch (error) {
      console.error("Error using HuggingFace transformers:", error);
      
      // Fallback responses if transformers fail
      const fallbackResponses = [
        `The ${projectData.name} shows promising results in reducing deforestation by implementing sustainable land management practices. The main drivers of deforestation in this area appear to be agricultural expansion and illegal logging.`,
        `Based on the project documentation, the primary challenges in ${projectData.location} are related to governance issues and competing land uses. The project has established a monitoring system that tracks forest cover changes on a quarterly basis.`,
        `Analysis of this project indicates moderate effectiveness in addressing deforestation drivers. The project has implemented community-based forest management approaches that have shown initial success, but long-term sustainability remains a concern.`
      ];
      
      queryResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
    
    // Construct the full response
    return {
      projectData,
      analysis: analysisResult,
      deforestationData,
      emissionsData,
      queryResponse
    };
    
  } catch (error) {
    console.error("Error processing query:", error);
    toast.error("Failed to process query. Please try again.");
    throw new Error("Failed to process query");
  }
};
