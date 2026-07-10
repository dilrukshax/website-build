import { Request, Response, NextFunction } from 'express';
import { ERROR_CODES } from '@project-aurora/core';

/**
 * requireSuperAdmin — Verifies that the authenticated user has isSuperAdmin set to true.
 * Assumes requireAuth has already run and populated req.auth and req.user.
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
    // req.user contains the decoded JWT payload as set by requireAuth
    if (!req.user || req.user.isSuperAdmin !== true) {
        res.status(403).json({
            success: false,
            error: { code: ERROR_CODES.FORBIDDEN, message: 'Super Admin access required' },
        });
        return;
    }
    
    next();
}
