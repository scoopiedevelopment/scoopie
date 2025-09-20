import apiClient from "./apiClient";

interface Media {
  id: string;
  postId: string;
  type: "Image" | "Video" | "Clip";
  url: string;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  profilePic?: string;
}

interface Post {
  id: string;
  userId: string;
  text?: string;
  visibility: "Public" | "Private" | "Archive";
  views: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  media: Media[];
  user: User;
}

interface Clip {
  id: string;
  userId: string;
  video: string;
  text?: string;
  visibility: "Public" | "Private" | "Archive";
  views: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  user: User;
}

interface SavedItem {
  createdAt: string;
  post?: Post;
  clip?: Clip;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SavedResponse {
  success: boolean;
  statusCode: number;
  request: {
    ip: string;
    method: string;
    url: string;
  };
  message: string;
  data:
    | SavedItem[]
    | {
        saved: SavedItem[];
        pagination: Pagination;
      };
}

interface ToggleSaveResponse {
  success: boolean;
  message: string;
  data: {
    saved: boolean;
  };
}

export const getSavedItems = async (
  page: number = 1
): Promise<SavedResponse | { success: false; message: string; data: [] }> => {
  try {
    const response = await apiClient.get<SavedResponse>(`/saved/get-saved/${page}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching saved items:", error);

    const message =
      (error as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message ||
      (error as Error).message ||
      "Failed to fetch saved items";

    return {
      success: false,
      message,
      data: [],
    };
  }
};

export const toggleSavePost = async (
  postId: string
): Promise<ToggleSaveResponse> => {
  try {
    const response = await apiClient.post<ToggleSaveResponse>("/saved/toggle", {
      postId,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error toggling save post:", error);
    throw error;
  }
};

export const toggleSaveClip = async (
  clipId: string
): Promise<ToggleSaveResponse> => {
  try {
    const response = await apiClient.post<{ message: string }>("/saved/toggle", {
      clipId,
    });

    if (response.data) {
      return {
        success: true,
        message: response.data.message || "Success",
        data: {
          saved: response.data.message === "Saved successfully",
        },
      };
    }

    return {
      success: false,
      message: "Unexpected response",
      data: { saved: false },
    };
  } catch (error: unknown) {
    console.error("Error toggling save clip:", error);
    throw error;
  }
};
