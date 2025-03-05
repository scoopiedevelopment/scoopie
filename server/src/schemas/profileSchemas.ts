import { z } from "zod";

export const createProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long"),
  name: z.string().max(20, "Name too long").nullable().optional(),
  bio: z.string().max(300, "Bio should be within 300 characters").nullable().optional(),
  dateofBirth: z.coerce.date().nullable().optional(),
  website: z.string().url("Invalid URL format").nullable().optional(),
  profilePic: z.string().url("Invalid URL format").nullable().optional(),
  type: z.enum(["PUBLIC", "PRIVATE", "BUSINESS"]).default("PUBLIC")
});

export const updateProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long").optional(),
  name: z.string().max(20, "Name too long").optional(),
  bio: z.string().max(300, "Bio should be within 300 characters").optional(),
  dateofBirth: z.coerce.date().optional(),
  website: z.string().url("Invalid URL format").optional(),
  profilePic: z.string().url("Invalid URL format").optional(),
  type: z.enum(["PUBLIC", "PRIVATE", "BUSINESS"]).default("PUBLIC")
});