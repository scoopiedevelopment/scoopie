import { z } from "zod";


export const createPostSchema = z.object({
  text: z.string().optional(),
  urls: z.array(z.string()).max(5).default([])
}).refine(
    (data) => data.text?.trim() !== "" || data.urls.length > 0, 
    {
      message: "Either text must be provided or at least one URL is required.",
      path: ["text"],
    }
  );