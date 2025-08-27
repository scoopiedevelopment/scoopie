export interface ProfileResponse {
  success: boolean;
  statusCode: number;
  request: {
    ip: string;
    method: string;
    url: string;
  };
  message: string;
  data: {
    email: string;
    profile: Profile;
  };
}

export interface Profile {
  id: string;
  userId: string;
  username: string;
  name: string;
  bio: string | null;
  dateofBirth: string | null;
  website: string | null;
  profilePic: string | null;
  address: string | null;
  type: 'Private' | 'Public';
  createdAt: string; 
  updatedAt: string; 
  _count: {
    followers: number;
    following: number;
    totalViews: number;
    totalLikes: number;
  };
}

export interface User {
  profilePic: string;
  username: string;
  userId: string;
}

export interface ClipCount {
  likes: number;
  comments: number;
}

export interface Clip {
  id: string;
  userId: string;
  visibility: string;
  video: string;
  text: string;
  views: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  user: User;
  _count: ClipCount;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}

export interface ClipResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    clips: Clip[];
    pagination: Pagination;
  };
}

export interface Media {
  id: string;
  postId: string;
  type: string;
  url: string;
  createdAt: string;
}


export interface Post {
  id: string;
  userId: string;
  text: string;
  visibility: string;
  views: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  media: Media[];
  user: User;
  _count: {
    likes: number;
    comments: number;
  };
}


export interface PostResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    post: Post[];
    pagination: Pagination;
  };
}

export interface User {
  username: string;
  profilePic: string;
  userId: string;
}

export interface Post {
  id: string;
  userId: string;
  text: string;
  visibility: string;
  views: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  user: User;
  _count: {
    likes: number;
    comments: number;
  };
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}

export interface PostTextResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    posts: Post[];
    pagination: Pagination;
  };
}
