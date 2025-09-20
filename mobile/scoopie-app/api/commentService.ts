import apiClient from './apiClient';

interface CommentUser {
  username: string;
  profilePic?: string;
  userId: string;
}

interface PostComment {
  id: string;
  postId?: string | null;
  clipId?: string | null;
  comment: string;
  commentById: string;
  parentCommentId?: string | null;
  createdAt: string;
  commentBy: CommentUser;
  _count: {
    likedBy: number;
  };
  replies?: PostComment[];
}

interface PostCommentResponse {
  success: boolean;
  message: string;
  data: PostComment[];
}

interface CreatePostCommentResponse {
  success: boolean;
  message: string;
  data: PostComment;
}

// Get comments for a specific post
export const getPostComments = async (postId: string, page: number = 1) => {
  try {
    const response = await apiClient.get(`/comment/get-comments/post/${postId}/${page}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Create a comment for a post
export const createPostComment = async (postId: string, text: string, parentCommentId?: string) => {
  try {
    const response = await apiClient.post('/comment/create', {
      postId: postId,
      comment: text,
      parentCommentId: parentCommentId
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Get replies for a specific comment
export const getCommentReplies = async (commentId: string, page: number = 1) => {
  try {
    const response = await apiClient.get(`/comment/get-comments/comment/${commentId}/${page}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Create a reply to a comment (for clips)
export const createCommentReply = async (commentId: string, text: string) => {
  try {
    const response = await apiClient.post('/comment/create', {
      commentId: commentId,
      comment: text
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Get replies for a specific comment (for posts)
export const getPostCommentReplies = async (commentId: string, page: number = 1) => {
  try {
    const response = await apiClient.get(`/comment/get-comments/comment/${commentId}/${page}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Get replies for a specific comment (for clips)
export const getClipCommentReplies = async (commentId: string, page: number = 1) => {
  try {
    const response = await apiClient.get(`/comment/get-comments/comment/${commentId}/${page}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Like a comment (works for both post and clip comments)
export const likeComment = async (commentId: string) => {
  try {
    const response = await apiClient.post('/comment/like', {
      commentId: commentId
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Utility function to organize comments into nested structure
export const organizeCommentsIntoNested = (comments: PostComment[]): PostComment[] => {
  const commentMap = new Map<string, PostComment>();
  const topLevelComments: PostComment[] = [];

  // First pass: create a map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: organize comments into hierarchy
  comments.forEach(comment => {
    if (comment.parentCommentId) {
      // This is a reply
      const parentComment = commentMap.get(comment.parentCommentId);
      if (parentComment) {
        parentComment.replies = parentComment.replies || [];
        parentComment.replies.push(commentMap.get(comment.id)!);
      }
    } else {
      // This is a top-level comment
      topLevelComments.push(commentMap.get(comment.id)!);
    }
  });

  // Sort replies by creation date (oldest first)
  const sortReplies = (comment: PostComment) => {
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      comment.replies.forEach(sortReplies); // Recursively sort nested replies
    }
  };

  topLevelComments.forEach(sortReplies);

  return topLevelComments;
};

export type { PostComment, PostCommentResponse, CreatePostCommentResponse };
