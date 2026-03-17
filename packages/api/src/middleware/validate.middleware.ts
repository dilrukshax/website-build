import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validation middleware factory using Zod schemas
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const data = schema.parse(req[source]);
            req[source] = data; // Replace with validated/transformed data
            next();
        } catch (error) {
            next(error); // Error handler will format Zod errors
        }
    };
}
