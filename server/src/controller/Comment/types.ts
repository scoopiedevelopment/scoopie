import { Prisma } from '@prisma/client';


export interface CommentBody {
    postId: string,
    clipId: string,
    commentId: string,
    comment: string,
    commentTo: string
}
  

export interface GetCommentsParams {
    type: string,
    id: string,
    page: string,
}

export interface CommentData {
    postId: string | null;
    clipId: string | null;
    parentCommentId: string | null;
    comment: string;
    commentById: string;
    createdAt: string;
}
  
export type UserDetails = Prisma.ProfileGetPayload<{
    select: { userId: true; username: true; profilePic: true };
  }>;
  