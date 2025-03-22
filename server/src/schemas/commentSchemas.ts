import { z } from "zod";



export const createCommentSchema = z.object({
    postId: z.string().optional(),
    clipId: z.string().optional(),
    comment: z.string(),
}).refine((data) => data.postId || data.clipId, {
    message: "Either postId or clipId is required.",
    path:["postId", "clipId"]
})