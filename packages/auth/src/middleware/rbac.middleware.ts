import { Request, Response, NextFunction } from 'express';
import { UserRole, ERROR_CODES } from '@booking-engine/core';

/**
 * Role hierarchy - higher index = more permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
    readonly: 0,
    staff: 1,
    admin: 2,
    owner: 3,
};

/**
 * Require a minimum role level
 */
export function requireRole(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                errors: [{ code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' }],
            });
            return;
        }

        const userRole = req.user.role as UserRole;
        const isAllowed = allowedRoles.some(
            (role) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]
        );

        if (!isAllowed) {
            res.status(403).json({
                success: false,
                errors: [
                    {
                        code: ERROR_CODES.FORBIDDEN,
                        message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
                    },
                ],
            });
            return;
        }

        next();
    };
}

/**
 * Require owner role specifically
 */
export const requireOwner = requireRole('owner');

/**
 * Require admin or higher
 */
export const requireAdmin = requireRole('admin');

/**
 * Require staff or higher
 */
export const requireStaff = requireRole('staff');
