import axios from 'axios';

// Get the base URL from environment variables, defaulting to localhost for development
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005';

// API endpoints
export const endpoints = {
  analyze: '/api/analyze',
  upload: '/api/upload',
  projectExists: '/api/projects/:projectId/exists',
  getProject: '/api/projects/:code'
};

// Type for API response
interface ApiResponse<T> {
  data: T;
  error?: string;
}
// Fetch project data by project code
export const getProjectData = async (projectCode: string): Promise<ApiResponse<any>> => {
  try {
    const response =  await axios.get(`${baseUrl}${endpoints.getProject.replace(':code', projectCode)}`);
    return { data: response.data };
  } catch (error: any) {
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

    const response = await axios.post<{ fileId: string }>(`${baseUrl}${endpoints.upload}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return { data: response.data };
  } catch (error: any) {
    return { 
      data: { fileId: '' }, 
      error: error?.response?.data?.error || error?.message || 'Failed to upload file'
    };
  }
};

// Check if a project exists
export const checkProjectExists = async (projectId: string): Promise<ApiResponse<{ exists: boolean }>> => {
  try {
    const response = await axios.get<{ exists: boolean }>(`${baseUrl}${endpoints.projectExists.replace(':projectId', projectId)}`);
    return { data: response.data };
  } catch (error: any) {
    return { 
      data: { exists: false }, 
      error: error?.response?.data?.error || error?.message || 'Failed to check project existence'
    };
  }
};
