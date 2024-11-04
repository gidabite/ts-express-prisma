import { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';

export function validateData(
    schemaParams: z.ZodObject<any, any> | null,
    schemaBody: z.ZodObject<any, any> | null = null,
) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schemaParams) schemaParams.parse(req.params);
            if (schemaBody) schemaBody.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map((issue) => ({
                    message: `${issue.path.join('.')} is ${issue.message}`,
                }));
                next({
                    error: 'Invalid data',
                    details: errorMessages,
                    statusCode: 400,
                });
            } else {
                next({ ...(error as object), statusCode: 500 });
            }
        }
    };
}
