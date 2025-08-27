// models/SearchModel.ts

export interface Profile {
  userId: string;
  name?: string;
  username?: string;
  profilePic?: string | null;
}

export interface Account {
  id: string;
  userId: string;
  username: string;
  name?: string;
  profilePic?: string | null;
  _count: {
    followers: number;
  };
}

export interface Media {
  id: string;
  postId: string;
  type: 'Image' | 'Video' | 'Text';
  url?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  text: string;
  media: Media[];
}

export interface Clip {
  id: string;
  video: string;
  text?: string;
  views?: number;
}

export interface TopSection {
  type: 'Accounts' | 'Posts' | 'clips';
  accounts?: Account[];
  posts?: Post[];
  clips?: Clip[];
}