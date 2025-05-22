import { z } from "zod";


export const likeSchema = z.object({
    clipId: z.string().optional(),
    postId: z.string().optional(),
    commentId: z.string().optional(),
    likedTo: z.string()
})