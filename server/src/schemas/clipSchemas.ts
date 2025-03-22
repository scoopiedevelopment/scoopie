import { z } from "zod";



export const createClipSchema = z.object({
    text: z.string().optional(),
    url: z.string().url()
})