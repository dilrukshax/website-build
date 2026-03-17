import { Request, Response, NextFunction } from 'express';
import { logger, ERROR_CODES } from '@booking-engine/core';

/**
 * AppError — structured application error with HTTP status code.
 * Replaces the AppError previously imported from @booking-engine/auth.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly field?: string;

    constructor(code: string, message: string, statusCode: number, field?: string) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.field = field;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

/**
 * Global error handler middleware.
 * Must be registered LAST in the Express middleware stack.
 * Never exposes stack traces in production.
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    // Known application errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err.field && { field: err.field }),
            },
        });
        return;
    }

    // Zod validation errors
    if (err.name === 'ZodError') {
        const zodError = err as unknown as { issues: Array<{ path: string[]; message: string }> };
        res.status(400).json({
            success: false,
            error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Validation failed',
                details: zodError.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                })),
            },
        });
        return;
    }

    // Unexpected errors — log internally, never expose stack in production
    logger.error('Unhandled error', {
        error: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });

    res.status(500).json({
        success: false,
        error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message,
        },
    });
}
