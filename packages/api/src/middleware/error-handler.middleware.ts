import { Request, Response, NextFunction } from 'express';
import { logger, ERROR_CODES } from '@booking-engine/core';
import { AppError } from '@booking-engine/auth';

/**
 * Global error handler middleware
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Handle known application errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            errors: [
                {
                    code: err.code,
                    message: err.message,
                    ...(err.field && { field: err.field }),
                },
            ],
        });
        return;
    }

    // Handle Zod validation errors
    if (err.name === 'ZodError') {
        const zodError = err as unknown as { issues: Array<{ path: string[]; message: string }> };
        res.status(400).json({
            success: false,
            errors: zodError.issues.map((issue) => ({
                code: ERROR_CODES.VALIDATION_ERROR,
                message: issue.message,
                field: issue.path.join('.'),
            })),
        });
        return;
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            errors: [{ code: ERROR_CODES.TOKEN_INVALID, message: 'Invalid token' }],
        });
        return;
    }

    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            errors: [{ code: ERROR_CODES.TOKEN_EXPIRED, message: 'Token expired' }],
        });
        return;
    }

    // Log unexpected errors
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
    });

    // Generic server error response
    res.status(500).json({
        success: false,
        errors: [
            {
                code: ERROR_CODES.INTERNAL_ERROR,
                message:
                    process.env.NODE_ENV === 'production'
                        ? 'Internal server error'
                        : err.message,
            },
        ],
    });
}
