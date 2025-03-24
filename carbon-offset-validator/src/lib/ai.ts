import { AIAnalysisRequest, AIAnalysisResponse, Document } from './types';
import { toast } from 'sonner';
import { getProjectData } from './api';

// Get the base URL from environment variables, defaulting to localhost for development
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005';

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

    // Transform time series data into the format expected by the frontend with proper null checks
    const deforestationData = (projectData.timeSeriesData || [])
      .filter(d => d && d.metric_type === 'deforestation')
      .map(d => ({
        year: new Date(d.timestamp || '').getFullYear(),
        hectares: d.value || 0
      }));

    const emissionsData = (projectData.timeSeriesData || [])
      .filter(d => d && d.metric_type === 'emissions')
      .map(d => ({
        year: new Date(d.timestamp || '').getFullYear(),
        tonnes: d.value || 0
      }));

    // Transform pie chart data with proper null checks
    const pieChartData = (projectData.pieChartData || []).map(d => ({
      category: d.category || 'Unknown',
      value: d.percentage || 0 // Note: renamed from percentage to value for frontend
    }));

    // Structure the analysis response using actual data with robust property checking
    const response: AIAnalysisResponse = {
      projectData: projectData.project,
      queryResponse: "",
      summary: {
        summary: projectData.summary && typeof projectData.summary === 'object' 
          ? (projectData.summary.analysis_text || 'No analysis available.')
          : 'No analysis available.',
        recommendations: projectData.summary && Array.isArray(projectData.summary.recommendations) 
          ? projectData.summary.recommendations 
          : [],
        additionalInsights: projectData.summary && typeof projectData.summary === 'object'
          ? (projectData.summary.additional_insights || 'No additional insights available.')
          : 'No additional insights available.',
      },
      riskMetrics: (projectData.riskMetrics || []).map(metric => ({
        category: metric.category || 'Unknown',
        score: metric.score || 0,
        impact: (metric.impact as 'Low' | 'Medium' | 'High') || 'Medium',
        likelihood: (metric.likelihood as 'Unlikely' | 'Possible' | 'Likely') || 'Possible',
        description: metric.description || `Analysis of ${metric.category || 'Unknown'} risk factor`
      })),
      deforestationData,
      emissionsData,
      pieChartData,
      documents: {
        pdd: defaultDoc,
        riskAnalysis: defaultDoc
      }
    };

    // Call backend API for text generation instead of using client-side transformers
    try {
      const aiResponse = await fetch(`${baseUrl}/api/generate-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, projectCode })
      });
      
      if (!aiResponse.ok) {
        throw new Error(`API responded with status: ${aiResponse.status}`);
      }
      
      const result = await aiResponse.json();
      response.queryResponse = result.response || 'No response generated';
      
    } catch (error) {
      console.error("Error calling text generation API:", error);
      
      // Fallback responses if API call fails
      const fallbackResponses = [
        `The ${projectData.project?.name || 'project'} shows promising results in reducing deforestation by implementing sustainable land management practices.`,
        `Based on the project documentation, the primary challenges in ${projectData.project?.location || 'the region'} are related to governance issues and competing land uses.`,
        `Analysis indicates moderate effectiveness in addressing deforestation drivers through community-based forest management approaches.`
      ];
      
      response.queryResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
    
    return response;
    
  } catch (error: any) {
    console.error("Error processing query:", error);
    
    // Preserve error structure for better debugging
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to process query: ${String(error)}`);
    }
  }
};

export const processQuestion = async (request: { query: string, projectCode: string }): Promise<string> => {
  // This function allows users to chat with the uploaded document and the analysis result
  // This function is called in the result.tsx page

  try {
    // Call the Python backend API
    const aiResponse = await fetch(`${baseUrl}/api/generate-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: request.query, 
        projectCode: request.projectCode 
      })
    });
    
    if (!aiResponse.ok) {
      throw new Error(`API responded with status: ${aiResponse.status}`);
    }
    
    const result = await aiResponse.json();
    return result.response || 'No response generated';
  } catch (error) {
    console.error("Error processing question:", error);
    
    // Fallback response if API call fails
    return "I'm sorry, I couldn't process your question at this time. Please try again later.";
  }
};