import axios from 'axios';
import { Project, RiskMetric, DeforestationData, EmissionsData, PieChartData } from './types';

// Get the base URL from environment variables, defaulting to localhost for development
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005';

// API endpoints
export const endpoints = {
  analyze: '/api/analyze',
  upload: '/api/upload',
  projectExists: '/api/projects/:code/exists',
  getProject: '/api/projects/:code'
};

// Type for API response
interface ApiResponse<T> {
  data: T | null;
  error?: string;
}

// Type for project data response from server
interface ProjectDataResponse {
  project: Project;
  summary: ProjectSummary;
  riskMetrics: RiskMetric[];
  timeSeriesData: (DeforestationData | EmissionsData)[];
  pieChartData: PieChartData[];
  geospatialData: GeoData[];
}

// Fetch project data by project code
export const getProjectData = async (projectCode: string): Promise<ApiResponse<ProjectDataResponse>> => {
  try {
    const response = await axios.get<ProjectDataResponse>(
      `${baseUrl}${endpoints.getProject.replace(':code', projectCode)}`
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

// Function to analyze a project
export const analyzeProject = async (projectCode: string, query: string): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(`${baseUrl}${endpoints.analyze}`, {
      projectCode,
      query,
    });
    return { data: response.data };
  } catch (error: any) {
    console.error('Error analyzing project:', error);
    return { 
      data: null, 
      error: error?.response?.data?.error || error?.message || 'Failed to analyze project'
    };
  }
};

// Function to upload a file
export const uploadFile = async (file: File): Promise<ApiResponse<{ fileId: string }>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<{ fileId: string }>(
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

// Check if a project exists
export const checkProjectExists = async (projectCode: string): Promise<ApiResponse<{ exists: boolean }>> => {
  try {
    // console.log('Checking project existence for:', projectCode);
    const url = `${baseUrl}${endpoints.projectExists.replace(':code', projectCode)}`;
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
