import apiClient from './apiClient';
import { ClipResponse, UploadClipResponse, UploadResponse, PostResponse } from '../models/UploadModel';

export const uploadImage = async (imageUri: string): Promise<UploadResponse> => {
  try {
    const formData: any = new FormData();
    formData.append('media', {
      uri: imageUri.startsWith('file://') ? imageUri : 'file://' + imageUri,
      type: 'image/jpeg',
      name: `upload_${Date.now()}.jpg`,
    });

    const response = await apiClient.post<UploadResponse>(
      '/upload/post',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Upload failed:', error.response?.data || error.message);
    throw error;
  }
};






export const uploadClip = async (videoUri: string): Promise<UploadClipResponse> => {
  try {
    const formData: any = new FormData();
    formData.append('media', {
      uri: videoUri.startsWith('file://') ? videoUri : 'file://' + videoUri,
      type: 'video/mp4',
      name: `clip_${Date.now()}.mp4`,
    });

    const response = await apiClient.post<UploadClipResponse>(
      '/upload/clip',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Upload failed:', error.response?.data || error.message);
    throw error;
  }
};


export const createClip = async (url: string, text: string) => {
  try {
    const response = await apiClient.post<ClipResponse>('/clip/create', {
      url,
      text,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating clip:', error.response?.data || error.message);
    throw error;
  }
};



export const createPost = async (urls: string[], text: string) => {
  try {
    const response = await apiClient.post<PostResponse>('/post/create', {
      urls,
      text,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating post:', error.response?.data || error.message);
    throw error;
  }
};