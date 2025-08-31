import apiClient from './apiClient';
import { CreateStoryRequest, CreateStoryResponse, StoryResponse } from '@/models/StoryModel';

export const getStories = async (page: number) => {
  try {
    const response = await apiClient.get<StoryResponse>(`/story/get?page=${page}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching stories:', error?.response || error);
    throw error;
  }
};

export const createStory = async (payload: CreateStoryRequest) => {
  try {
    const response = await apiClient.post<CreateStoryResponse>(
      '/story/create',
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating story:', error?.response || error);
    throw error;
  }
};

