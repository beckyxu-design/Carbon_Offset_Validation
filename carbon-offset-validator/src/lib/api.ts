import axios from 'axios';

// Get the base URL from environment variables, defaulting to localhost for development
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// API client for making requests to our backend
const api = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const endpoints = {
  analyze: '/api/analyze',
  upload: '/api/upload',
};

// Type for API response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Function to analyze a project
export const analyzeProject = async (projectId: string, query: string): Promise<ApiResponse<any>> => {
  try {
    const response = await api.post(endpoints.analyze, { projectId, query });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to analyze project',
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

// Function to upload a file
export const uploadFile = async (file: File): Promise<ApiResponse<{ fileId: string }>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(endpoints.upload, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upload file',
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};
