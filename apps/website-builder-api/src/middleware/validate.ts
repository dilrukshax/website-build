import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validation middleware factory using Zod schemas.
 * Replaces the req body/query/params with the parsed + transformed output.
 * Passes ZodError to next() for the global error handler to format.
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const data = schema.parse(req[source]);
            req[source] = data;
            next();
        } catch (error) {
            next(error);
        }
    };
}
