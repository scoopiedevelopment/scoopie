import { NextFunction, Request, Response } from "express"
import { ZodSchema } from "zod"


export const validateRequest = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        const result = schema.safeParse(req.body);

        if(!result.success) {
            
            const formattedErrors = Object.entries(result.error.format())
            .filter(([key]) => key !== "_errors")
            .map(([field, error]) => ({
                field,
                message: Array.isArray(error) ? error.join(", ") : (error as any)._errors?.join(", ") || "Invalid input"
            }));

            res.status(400).json({
                success: false,
                message: "Validation Failed.",
                errors: formattedErrors
            });
            return;
        }
        req.body = result.data;
        next();
    }
}