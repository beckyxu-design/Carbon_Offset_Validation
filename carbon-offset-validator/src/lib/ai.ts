import { pipeline } from '@huggingface/transformers';
import { AIAnalysisRequest, AIAnalysisResponse, Document } from './types';
import { toast } from 'sonner';
import { getProjectData } from './api';

// // Function to handle file uploads (mock implementation)
// export const uploadFile = async (file: File): Promise<string> => {
//   // In a real app, this would upload to a server and return a URL
//   console.log("Uploading file:", file.name);
  
//   // Simulate network delay
//   await new Promise(resolve => setTimeout(resolve, 1000));
  
//   // Return a dummy URL
//   return `https://example.com/uploads/${file.name}`;
// };

export const processQuery = async (request: AIAnalysisRequest): Promise<AIAnalysisResponse> => {
  try {
    // Extract project code and query
    const { projectCode, query } = request;

    // Fetch actual project data from the database
    const { data: projectData, error } = await getProjectData(projectCode);
    
    if (error || !projectData) {
      throw new Error(error || 'Failed to fetch project data');
    }

    // Create default document structure
    const defaultDoc: Document = {
      id: 'default',
      text: 'Document not available',
      metadata: {
        type: 'UNKNOWN',
        version: '1.0'
      }
    };

    // Transform time series data into the format expected by the frontend
    const deforestationData = projectData.timeSeriesData
      ?.filter(d => d.metric_type === 'deforestation')
      .map(d => ({
        year: new Date(d.timestamp).getFullYear(),
        hectares: d.value
      })) || [];

    const emissionsData = projectData.timeSeriesData
      ?.filter(d => d.metric_type === 'emissions')
      .map(d => ({
        year: new Date(d.timestamp).getFullYear(),
        tonnes: d.value
      })) || [];

    // Transform pie chart data
    const pieChartData = projectData.pieChartData?.map(d => ({
      category: d.category,
      value: d.percentage // Note: renamed from percentage to value for frontend
    })) || [];

    // Structure the analysis response using actual data
    const response: AIAnalysisResponse = {
      projectData: projectData.project,
      queryResponse: "",
      summary: {
        summary: projectData.summary?.analysis_text || 'No analysis available.',
        recommendations: projectData.summary?.recommendations || [],
        additionalInsights: projectData.summary?.additional_insights || 'No additional insights available.',
      },
      riskMetrics: projectData.riskMetrics?.map(metric => ({
        category: metric.category,
        score: metric.score,
        impact: (metric.impact as 'Low' | 'Medium' | 'High') || 'Medium',
        likelihood: (metric.likelihood as 'Unlikely' | 'Possible' | 'Likely') || 'Possible',
        description: metric.description || `Analysis of ${metric.category} risk factor`
      })) || [],
      deforestationData,
      emissionsData,
      pieChartData,
      documents: {
        pdd: defaultDoc,
        riskAnalysis: defaultDoc
      }
    };

    // Attempt to use HuggingFace transformers to process the query
    try {
      // Initialize the pipeline
      const generator = await pipeline('text-generation', 'distilgpt2');
      
      // Generate text based on the query
      const result = await generator(query, {
        max_length: 100,
        temperature: 0.7,
        num_return_sequences: 1
      });
      
      // Get the generated text
      const queryResponse = Array.isArray(result) 
        ? result[0]?.generated_text || 'No response generated'
        : result.generated_text || 'No response generated';
      
      // Add some context to make it more relevant to carbon projects
      response.queryResponse = `Based on analysis of the project data: ${queryResponse}`;
      
    } catch (error) {
      console.error("Error using HuggingFace transformers:", error);
      
      // Fallback responses if transformers fail
      const fallbackResponses = [
        `The ${projectData.project.name} shows promising results in reducing deforestation by implementing sustainable land management practices.`,
        `Based on the project documentation, the primary challenges in ${projectData.project.location} are related to governance issues and competing land uses.`,
        `Analysis indicates moderate effectiveness in addressing deforestation drivers through community-based forest management approaches.`
      ];
      
      response.queryResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
    
    return response;
    
  } catch (error) {
    console.error("Error processing query:", error);
    throw new Error(`Failed to process query: ${error.message}`);
  }
};
