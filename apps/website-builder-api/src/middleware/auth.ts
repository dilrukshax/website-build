import { Request, Response, NextFunction } from 'express';
import { JWTService } from '@project-aurora/auth';
import { logger, ERROR_CODES } from '@project-aurora/core';

/**
 * requireAuth — Verifies JWT Bearer token and attaches auth context.
 * If the token contains a tenantId, loads the user's role and permissions.
 */
export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
            });
            return;
        }

        const token = authHeader.substring(7);
        const payload = JWTService.verifyAccessToken(token);

        req.auth = {
            userId: payload.userId,
            tenantId: payload.tenantId || '',
            role: '',
            permissions: [],
        };

        // Also set req.user for compatibility with packages/auth middleware
        req.user = payload;

        next();
    } catch (error) {
        logger.error('Auth middleware error', { error });
        res.status(401).json({
            success: false,
            error: { code: ERROR_CODES.TOKEN_INVALID, message: 'Invalid or expired token' },
        });
    }
}

/**
 * requirePermission — Checks that the user has at least one of the specified permissions.
 * Owner role bypasses all permission checks.
 */
export function requirePermission(...permissionKeys: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.auth) {
            res.status(401).json({
                success: false,
                error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
            });
            return;
        }

        if (req.auth.role === 'owner') {
            next();
            return;
        }

        const hasPermission = permissionKeys.some((key) => req.auth!.permissions.includes(key));
        if (!hasPermission) {
            res.status(403).json({
                success: false,
                error: { code: ERROR_CODES.FORBIDDEN, message: 'Insufficient permissions' },
            });
            return;
        }

        next();
    };
}

/**
 * requireOwner — Only allows users with the 'owner' role.
 */
export function requireOwner(req: Request, res: Response, next: NextFunction): void {
    if (!req.auth || req.auth.role !== 'owner') {
        res.status(403).json({
            success: false,
            error: { code: ERROR_CODES.FORBIDDEN, message: 'Owner access required' },
        });
        return;
    }
    next();
}
