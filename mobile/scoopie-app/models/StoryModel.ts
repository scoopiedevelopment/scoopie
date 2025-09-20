export interface StoryItem {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'Image' | 'Video';
  createdAt: string;
  expiresAt: string;
}

export interface UserStory {
  userId: string;
  username: string;
  profilePic: string | null;
  stories: StoryItem[];
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}

export interface StoryResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    stories: UserStory[];
    pagination?: Pagination;
  };
}

export interface CreateStoryRequest {
  mediaUrl: string;
  mediaType: string;
}

export interface CreateStoryResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: any;
}
