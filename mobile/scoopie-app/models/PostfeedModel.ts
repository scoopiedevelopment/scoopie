export type Media = {
  url: string;
};

export type User = {
  userId?: string;
  id?: string;     
  username: string;
  profilePic: string | null;
};

export type PostFeed = {
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
};

export type PostFeedResponse = {
  success: boolean;
  statusCode: number;
  request: {
    ip: string;
    method: string;
    url: string;
  };
  message: string;
  data: PostFeed[];
};
