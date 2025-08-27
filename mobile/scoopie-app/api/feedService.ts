import apiClient from './apiClient';
import { PostFeedResponse } from '../models/PostfeedModel';

export const getPostFeeds = async (page: number = 1) => {
  try {
    const response = await apiClient.get<PostFeedResponse>(`/feed/postFeeds/${page}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching post feeds:', error?.response || error);
    throw error;
  }
};

export const getAddedFeeds = async (page: number) => {
  try {
    const response = await apiClient.get<PostFeedResponse>(`/feed/addedFeeds/${page}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching added feeds:', error?.response || error);
    throw error;
  }
};
