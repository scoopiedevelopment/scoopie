export interface Follower {
  username: string;
  name: string;
  profilePic: string;
  userId: string;
}

export interface FollowersResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    followers: { follower: Follower }[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
      limit: number;
    };
  };
}
