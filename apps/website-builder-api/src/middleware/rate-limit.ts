import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ERROR_CODES } from '@project-aurora/core';
import { extractClientIp } from '../utils/request-ip';

const createLimiter = (windowMs: number, max: number, message: string) => {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req: Request) => extractClientIp(req) || 'unknown-ip',
        handler: (_req: Request, res: Response) => {
            res.status(429).json({
                success: false,
                error: {
                    code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
                    message,
                },
            });
        },
    });
};

export const loginLimiter = createLimiter(
    60 * 1000,
    5,
    'Too many login attempts from this IP. Please try again in a minute.'
);

export const registerLimiter = createLimiter(
    60 * 1000,
    3,
    'Too many registration attempts from this IP. Please try again in a minute.'
);

export const refreshLimiter = createLimiter(
    60 * 1000,
    30,
    'Too many refresh attempts. Please try again in a minute.'
);

export const forgotPasswordLimiter = createLimiter(
    60 * 1000,
    3,
    'Too many password reset requests. Please try again in a minute.'
);

export const bookingLimiter = createLimiter(
    60 * 1000,
    5,
    'Too many booking requests from this IP. Please try again in a minute.'
);

export const inquiryLimiter = createLimiter(
    60 * 1000,
    5,
    'Too many inquiry requests from this IP. Please try again in a minute.'
);

export const cmsWriteLimiter = createLimiter(
    60 * 1000,
    100,
    'Too many operations. Please try again shortly.'
);
