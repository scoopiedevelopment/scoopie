import { z } from "zod"

export const registerSchema = z.object({
    email: z.string().email({
        message: "Invalid email Address."
    }),
    password: z.string().min(6, {
        message: "Password must be atleast 6 characters long."
    })
});