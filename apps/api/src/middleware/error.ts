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

interface AppErrorLike {
    code: string;
    message: string;
    statusCode: number;
    field?: string;
    details?: Array<{ field?: string; message?: string }>;
}

function isAppErrorLike(error: unknown): error is AppErrorLike {
    if (!error || typeof error !== 'object') {
        return false;
    }

    const candidate = error as Record<string, unknown>;
    return (
        typeof candidate.code === 'string'
        && typeof candidate.message === 'string'
        && typeof candidate.statusCode === 'number'
    );
}

function normalizeDetails(details: unknown): Array<{ field: string; message: string }> {
    if (!Array.isArray(details)) {
        return [];
    }

    const normalized: Array<{ field: string; message: string }> = [];
    for (const detail of details) {
        if (!detail || typeof detail !== 'object') {
            continue;
        }

        const entry = detail as Record<string, unknown>;
        if (typeof entry.message !== 'string' || !entry.message.trim()) {
            continue;
        }

        normalized.push({
            field: typeof entry.field === 'string' ? entry.field : '',
            message: entry.message,
        });
    }

    return normalized;
}

function getPrismaUniqueConstraintField(error: unknown): string | undefined {
    if (!error || typeof error !== 'object') {
        return undefined;
    }

    const candidate = error as Record<string, unknown>;
    if (candidate.code !== 'P2002') {
        return undefined;
    }

    const meta = candidate.meta as Record<string, unknown> | undefined;
    const target = meta?.target;
    if (Array.isArray(target)) {
        const first = target.find((item) => typeof item === 'string');
        return typeof first === 'string' ? first : undefined;
    }

    return typeof target === 'string' ? target : undefined;
}

function getPrismaErrorCode(error: unknown): string | undefined {
    if (!error || typeof error !== 'object') {
        return undefined;
    }

    const candidate = error as Record<string, unknown>;
    return typeof candidate.code === 'string' ? candidate.code : undefined;
}

function isPrismaInitializationError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false;
    }

    const candidate = error as Record<string, unknown>;
    const errorName = typeof candidate.name === 'string' ? candidate.name : '';
    const code = typeof candidate.code === 'string' ? candidate.code : '';

    if (errorName === 'PrismaClientInitializationError') {
        return true;
    }

    // Prisma connection/auth startup errors.
    return /^P10\d{2}$/.test(code);
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
    if (err instanceof AppError || isAppErrorLike(err)) {
        const appError = err as AppErrorLike;
        const details = normalizeDetails(appError.details);
        res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code,
                message: appError.message,
                ...(appError.field && { field: appError.field }),
                ...(details.length > 0 && { details }),
            },
        });
        return;
    }

    // Prisma unique constraint errors (e.g., duplicate email)
    const uniqueField = getPrismaUniqueConstraintField(err);
    if (uniqueField) {
        const isEmail = uniqueField.toLowerCase().includes('email');
        res.status(409).json({
            success: false,
            error: {
                code: isEmail ? ERROR_CODES.EMAIL_ALREADY_EXISTS : ERROR_CODES.VALIDATION_ERROR,
                message: isEmail ? 'A user with this email already exists' : 'A record with this value already exists',
                field: uniqueField,
            },
        });
        return;
    }

    // Prisma database initialization/connectivity errors
    if (isPrismaInitializationError(err)) {
        logger.error('Database unavailable', {
            error: err.message,
            prismaCode: getPrismaErrorCode(err),
            stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        });

        res.status(503).json({
            success: false,
            error: {
                code: ERROR_CODES.DATABASE_ERROR,
                message: 'Database is temporarily unavailable. Please try again in a moment.',
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
