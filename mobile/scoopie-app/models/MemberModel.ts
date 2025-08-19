// export interface Follower {
//   username: string;
//   name: string;
//   profilePic: string;
//   userId: string;
// }

// export interface FollowersResponse {
//   success: boolean;
//   statusCode: number;
//   message: string;
//   data: {
//     followers: { follower: Follower }[];
//     pagination: {
//       currentPage: number;
//       totalPages: number;
//       totalCount: number;
//       hasNext: boolean;
//       hasPrev: boolean;
//       limit: number;
//     };
//   };
// }



export interface Follower {
  username: string;
  name: string;
  profilePic: string;
  userId: string;
}
export interface Following {
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

export interface FollowingResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    following: { following: Following }[];
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