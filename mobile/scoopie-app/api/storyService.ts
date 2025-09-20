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
    console.log('Fetching stories for page:', page);
    const response = await apiClient.get<StoryResponse>(`/story/get?page=${page}`);
    console.log('Stories API response:', response.data.data);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Validate response structure
    if (!response.data) {
      console.error('No data in response');
      throw new Error('No data received from server');
    }
    /*
    if (typeof response.data !== 'object') {
      console.error('Invalid response data type:', typeof response.data);
      throw new Error('Invalid response format');
    }
    
    // Check for expected structure: data.stories array
    if (!response.data.) {
      console.error('No stories property in response:', response.data);
      throw new Error('Invalid stories data format - missing data.stories');
    }
    
    if (!Array.isArray(response.data.stories)) {
      console.error('Invalid stories structure:', response.data);
      throw new Error('Invalid stories data format - expected data.stories array');
    }
    
    console.log('Stories array structure:', response.data.stories);
    console.log('Number of user story groups:', response.data.stories.length);
    
    return response.data;
  } catch (err) {
    const error = err as ApiError;
    
    console.error('Error fetching stories:', error);
    console.error('Error response:', error.response);
    console.error('Error message:', error.message);
    
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
    */
   return response.data;
  };

export const createStory = async (payload: CreateStoryRequest): Promise<CreateStoryResponse> => {
  try {
    console.log('Creating story with payload:', payload);
    const response = await apiClient.post<CreateStoryResponse>(
      '/story/create',
      payload
    );
    console.log('Story creation response:', response.data);
    return response.data;
  } catch (err) {
    const error = err as ApiError;
    
    console.error('Error creating story:', error);
    
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
