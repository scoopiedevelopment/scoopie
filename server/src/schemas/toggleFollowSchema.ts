import { z } from "zod";


export const toggleFollowSchema = z.object({
    followingId: z.string(),
    followerId: z.string(),
    action: z.enum(["Unfollow", "Follow"])
}).refine(data => ["Unfollow", "Follow"].includes(data.action), {
    message: "Action can be either Follow or Unfollow.",
    path: ["action"],
});