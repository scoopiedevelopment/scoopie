import apiClient from './apiClient';

interface SavedItem {
  id: string;
  post?: {
    id: string;
    media: { url: string; type: string }[];
    text?: string;
    user: {
      username: string;
      name: string;
      profilePic?: string;
    };
    createdAt: string;
  };
  clip?: {
    id: string;
    url: string;
    title?: string;
    user: {
      username: string;
      name: string;
      profilePic?: string;
    };
    createdAt: string;
  };
  createdAt: string;
}

interface SavedResponse {
  success: boolean;
  message: string;
  data: {
    saved: SavedItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface ToggleSaveResponse {
  success: boolean;
  message: string;
  data: {
    saved: boolean;
  };
}

export const getSavedItems = async (page: number = 1) => {
  try {
    console.log('Making API call to get saved items, page:', page);
    const response = await apiClient.get<SavedResponse>(`/saved/get-saved/${page}`);
    
    console.log('Saved items API raw response:', response.data);
    
    // Return the response in the expected format
    return response.data;
  } catch (error: any) {
    console.error('Error fetching saved items:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message
    });
    
    // Return empty response structure to prevent crashes
    return {
      success: false,
      message: error?.response?.data?.message || error?.message || 'Failed to fetch saved items',
      data: {
        saved: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        }
      }
    };
  }
};

export const toggleSavePost = async (postId: string) => {
  try {
    const response = await apiClient.post<ToggleSaveResponse>('/saved/toggle', {
      postId,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error toggling save post:', error?.response || error);
    throw error;
  }
};

export const toggleSaveClip = async (clipId: string) => {
  try {
    const response = await apiClient.post('/saved/toggle', {
      clipId: clipId
    });
    
    // The server returns success/error in different format, let's handle it
    if (response.data) {
      return {
        success: true,
        message: response.data.message || 'Success',
        data: {
          saved: response.data.message === 'Saved successfully'
        }
      };
    }
    return response.data;
  } catch (error: any) {
    console.error('Error toggling save clip:', error?.response || error);
    throw error;
  }
};