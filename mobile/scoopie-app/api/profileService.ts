import apiClient from './apiClient';
import { ProfileResponse, ClipResponse, PostResponse, PostTextResponse } from '../models/ProfileModel';

export const getProfile = async () => {
  try {
    const response = await apiClient.get<ProfileResponse>(`/profile/get-profile`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching profile:', error?.response || error);
    throw error;
  }
};


export const getUserClips = async (page: number = 1) => {
  try {
    const response = await apiClient.get<ClipResponse>(`/clip/get-user-clips?page=${page}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user clips:', error?.response || error);
    throw error;
  }
};



export const getUserPosts = async (page: number = 1) => {
  try {
    const response = await apiClient.get<PostResponse>(
      `/post/get-user-posts?page=${page}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user posts:', error?.response || error);
    throw error;
  }
};



export const getUserTextPosts = async (page: number) => {
  try {
    const response = await apiClient.get<PostTextResponse>(
      `/post/get-user-text-posts?page=${page}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user text posts:', error?.response || error);
    throw error;
  }
};

