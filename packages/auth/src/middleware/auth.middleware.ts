import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/jwt.service';
import { JWTPayload, ERROR_CODES } from '@project-aurora/core';

// Extend Express Request type for auth middleware
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

/**
 * Middleware to authenticate requests via JWT Bearer token
 */
export function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            errors: [
                {
                    code: ERROR_CODES.UNAUTHORIZED,
                    message: 'Authentication required. Please provide a valid Bearer token.',
                },
            ],
        });
        return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    try {
        const payload = JWTService.verifyAccessToken(token);
        req.user = payload;
        next();
    } catch {
        res.status(401).json({
            success: false,
            errors: [
                {
                    code: ERROR_CODES.TOKEN_INVALID,
                    message: 'Invalid or expired token',
                },
            ],
        });
    }
}

/**
 * Optional auth - attaches user if token present, continues if not
 */
export function optionalAuthMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            req.user = JWTService.verifyAccessToken(token);
        } catch {
            // Token invalid, continue without auth
        }
    }

    next();
}
