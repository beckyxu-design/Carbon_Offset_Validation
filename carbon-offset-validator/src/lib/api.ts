import axios from 'axios';
import { Project, Summary, RiskMetric, DeforestationData, EmissionsData, PieChartData } from './types';

// Get the base URL from environment variables, defaulting to localhost for development
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005';

// API endpoints
const endpoints = {
  projects: '/api/projects',
  projectExists: (code: string) => `/api/projects/${code}/exists`,
  projectDetail: (code: string) => `/api/projects/${code}`,
  analyze: '/api/analyze',
  upload: '/api/upload',
};

// Type for API response
interface ApiResponse<T> {
  data: T | null;
  error?: string;
}

// Type for project data response from server
interface ProjectDataResponse {
  project: Project;
  summary: Summary;
  riskMetrics: RiskMetric[];
  timeSeriesData: (DeforestationData | EmissionsData)[];
  pieChartData: PieChartData[];
  // geospatialData: GeoData[];
}

// Function to upload a file
export const uploadFile = async (file: File): Promise<ApiResponse<{ fileId: string, text: string }>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<{ fileId: string, text: string }>(
      `${baseUrl}${endpoints.upload}`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return { data: response.data };
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return { 
      data: null, 
      error: error?.response?.data?.error || error?.message || 'Failed to upload file'
    };
  }
};

// Fetch project data by project code
//A promise is a JavaScript object representing the eventual completion or failure of an asynchronous operation.
// a Promise is an object that represents a future result or error. It can have three states:
// Pending: Operation is ongoing.
// Fulfilled (Resolved): Operation succeeded, promise returns a value.
// Rejected: Operation failed, promise returns an error.
export const getProjectData = async (projectCode: string): Promise<ApiResponse<ProjectDataResponse>> => {
  try {
    const response = await axios.get<ProjectDataResponse>(
      `${baseUrl}${endpoints.projectDetail(projectCode)}`
    );
    
    // Validate the response data structure
    const data = response.data;
    if (!data.project || !data.project.project_code) {
      throw new Error('Invalid project data structure received from server');
    }
    
    return { data };
  } catch (error: any) {
    console.error('Error fetching project data:', error);
    return { 
      data: null, 
      error: error?.response?.data?.error || error?.message || 'Failed to fetch project data'
    };
  }
};


// Check if a project exists
export const checkProjectExists = async (projectCode: string): Promise<ApiResponse<{ exists: boolean }>> => {
  try {
    // console.log('Checking project existence for:', projectCode);
    const url = `${baseUrl}${endpoints.projectExists(projectCode)}`;
    // console.log('Request URL:', url);
    
    const response = await axios.get<{ exists: boolean }>(url);
    // console.log('Server response:', response.data);
    
    return { data: response.data };
  } catch (error: any) {
    console.error('Error checking project existence:', error);
    const errorMessage = error?.response?.data?.error || error?.message || 'Failed to check project existence';
    console.error('Error details:', errorMessage);
    
    return { 
      data: null, 
      error: errorMessage
    };
  }
};

// Function to analyze a project
export const analyzeProject = async (
  projectCode: string, 
  query: string,
  documentText: string,
  policyDocuments?: string,
  regionalPolicies?: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(`${baseUrl}${endpoints.analyze}`, {
      projectCode,
      query,
      document_text: documentText,
      policy_documents: policyDocuments,
      regional_policies: regionalPolicies
    });
    // In Axios, the response you get after a successful request contains several properties, such as:
    // data: Actual response payload from the server (usually JSON).
    // status: HTTP status code (e.g., 200, 404, 500).
    // headers: HTTP headers sent by the server.
    return { data: response.data };
  } catch (error: any) {
    console.error('Error analyzing project:', error);
    return { 
      data: null, 
      error: error?.response?.data?.error || error?.message || 'Failed to analyze project'
    };
  }
};

