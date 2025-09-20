import apiClient from './apiClient';

interface ClipUser {
  userId: string;
  username: string;
  profilePic?: string;
}

interface Clip {
  id: string;
  video: string;
  text?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: ClipUser;
  _count: {
    likes: number;
    comments: number;
  };
}

interface ClipResponse {
  success: boolean;
  message: string;
  data: Clip;
}

interface ClipsResponse {
  success: boolean;
  message: string;
  data: Clip[];
}

export const getClipById = async (clipId: string) => {
  try {
    const response = await apiClient.get<ClipResponse>(`/clip/get-clip-by-id/${clipId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching clip by ID:', error?.response || error);
    throw error;
  }
};

export const getUserClips = async (userId: string, page: number = 1) => {
  try {
    const response = await apiClient.get<ClipsResponse>(`/clip/get-user-clips/${userId}/${page}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user clips:', error?.response || error);
    throw error;
  }
};

export const createClip = async (url: string, text?: string) => {
  try {
    const response = await apiClient.post<ClipResponse>('/clip/create', {
      url,
      text,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating clip:', error?.response || error);
    throw error;
  }
};

export const getClipsFeed = async (page: number = 1) => {
  try {
    const response = await apiClient.get<ClipsResponse>(`/feed/clipsFeeds/${page}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching clips feed:', error?.response || error);
    throw error;
  }
};

export const deleteClip = async (clipId: string) => {
  try {
    const response = await apiClient.delete(`/clip/delete/${clipId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting clip:', error?.response || error);
    throw error;
  }
};

export const toggleLikeClip = async (clipId: string, likedTo: string) => {
  try {
    const response = await apiClient.post('/like/toggle', {
      clipId: clipId,
      likedTo: likedTo
    });
    return response.data;
  } catch (error: any) {
    console.error('Error toggling like:', error?.response || error);
    throw error;
  }
};

export const followUser = async (userId: string) => {
  try {
    const response = await apiClient.post(`/connection/follow/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error following user:', error?.response || error);
    throw error;
  }
};

export const getComments = async (clipId: string, page: number = 1) => {
  try {
    console.log('Fetching comments:', clipId, page);
    const response = await apiClient.get(`/comment/get-comments/clip/${clipId}/${page}`);
    console.log('Comments fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching comments:', error?.response || error);
    throw error;
  }
};

export const createComment = async (clipId: string, text: string, parentCommentId?: string) => {
  try {
    console.log('Creating comment:', clipId, text);
    console.log('Creating comment:', clipId, text, 'parent:', parentCommentId);
    const response = await apiClient.post('/comment/create', {
      clipId: clipId,
      comment: text
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating comment:', error?.response || error);
    throw error;
  }
};

export const createChildComment = async (commentId: string, text: string) => {
  try {
    console.log('Creating comment:', commentId, text);
    const response = await apiClient.post('/comment/create', {
      commentId: commentId,
      comment: text,
      parentCommentId: parentCommentId
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating comment:', error?.response || error);
    throw error;
  }
};