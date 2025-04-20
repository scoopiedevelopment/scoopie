import { z } from 'zod';



export const createCommentSchema = z.object({
    postId: z.string().optional(),
    clipId: z.string().optional(),
    commentId: z.string().optional(),
    comment: z.string(),
}).refine((data) => data.postId || data.clipId || data.commentId, {
    message: 'Either postId or clipId or commentId is required.',
    path:['postId', 'clipId', 'commentId']
})