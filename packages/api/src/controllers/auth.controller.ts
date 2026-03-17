import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@booking-engine/auth';

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.register(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.login(req.body);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;
            const tokens = await AuthService.refreshToken(refreshToken);
            res.json({ success: true, data: tokens });
        } catch (error) {
            next(error);
        }
    }

    static async me(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
                return;
            }
            const result = await AuthService.getCurrentUser(req.user.userId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async logout(_req: Request, res: Response) {
        // JWT is stateless, so logout is client-side (discard token)
        // Could implement token blacklist with Redis in future
        res.json({ success: true, data: { message: 'Logged out successfully' } });
    }

    static async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            await AuthService.forgotPassword(req.body);
            // Always return a generic success to prevent user enumeration
            res.json({
                success: true,
                data: { message: 'If this email is registered, a password reset link has been sent.' },
            });
        } catch (error) {
            next(error);
        }
    }

    static async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            await AuthService.resetPassword(req.body);
            res.json({ success: true, data: { message: 'Password has been reset successfully. Please log in.' } });
        } catch (error) {
            next(error);
        }
    }
}
