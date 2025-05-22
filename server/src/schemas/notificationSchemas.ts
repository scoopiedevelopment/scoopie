import { z } from "zod";


export const saveFcmSchema = z.object({
    token: z.string(),
    deviceInfo: z.string()
})