// import apiClient from './apiClient';
// import { CreateStoryRequest, CreateStoryResponse, StoryResponse } from '@/models/StoryModel';

// export const getStories = async (page: number = 1) => {
//   try {
//     console.log('Fetching stories for page:', page);
//     const response = await apiClient.get<StoryResponse>(`/story/get?page=${page}`);
//     console.log('Stories response:', response.data);
//     return response.data;
//   } catch (error: any) {
//     console.error('Error fetching stories:', error?.response || error);
//     throw error;
//   }
// };

// export const createStory = async (payload: CreateStoryRequest) => {
//   try {
//     const response = await apiClient.post<CreateStoryResponse>(
//       '/story/create',
//       payload
//     );
//     return response.data;
//   } catch (error: any) {
//     console.error('Error creating story:', error?.response || error);
//     throw error;
//   }
// };



import apiClient from './apiClient';
import { CreateStoryRequest, CreateStoryResponse, StoryResponse } from '@/models/StoryModel';

interface ApiError {
  response?: {
    data?: unknown;
    status?: number;
    message?: string;
  };
  message?: string;
  code?: string;
}

export const getStories = async (page: number = 1): Promise<StoryResponse> => {
  try {
    const response = await apiClient.get<StoryResponse>(`/story/get?page=${page}`);
    return response.data;
  } catch (err) {
    const error = err as ApiError;
    
    // Handle different types of errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      throw new Error('Network connection failed. Please check your internet connection.');
    }
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    }
    
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    // Generic error fallback
    const errorMessage = error.response?.message || error.message || 'Failed to fetch stories';
    throw new Error(errorMessage);
  }
};

export const createStory = async (payload: CreateStoryRequest): Promise<CreateStoryResponse> => {
  try {
    const response = await apiClient.post<CreateStoryResponse>(
      '/story/create',
      payload
    );
    return response.data;
  } catch (err) {
    const error = err as ApiError;
    
    // Handle different types of errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      throw new Error('Network connection failed. Please check your internet connection.');
    }
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    }
    
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    // Generic error fallback
    const errorMessage = error.response?.message || error.message || 'Failed to create story';
    throw new Error(errorMessage);
  }
};
