import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@booking-engine/auth';

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
};

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await AuthService.register(req.body);
            res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
            res.status(201).json({
                success: true,
                data: {
                    accessToken: result.tokens.accessToken,
                    user: result.user,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await AuthService.login(req.body);
            res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
            res.json({
                success: true,
                data: {
                    accessToken: result.tokens.accessToken,
                    user: result.user,
                    tenants: result.tenants,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async switchTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await AuthService.switchTenant(req.user!.userId, req.body);
            res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
            res.json({
                success: true,
                data: {
                    accessToken: result.tokens.accessToken,
                    tenant: result.tenant,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const token = req.body.refreshToken || req.cookies?.refreshToken;
            if (!token) {
                res.status(400).json({
                    success: false,
                    error: { code: 'MISSING_TOKEN', message: 'Refresh token is required' },
                });
                return;
            }
            const tokens = await AuthService.refreshToken(token);
            res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
            res.json({
                success: true,
                data: { accessToken: tokens.accessToken },
            });
        } catch (error) {
            next(error);
        }
    }

    static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await AuthService.getCurrentUser(req.user!.userId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await AuthService.logout(req.user!.userId);
            res.clearCookie('refreshToken', { path: '/' });
            res.json({ success: true, data: { message: 'Logged out successfully' } });
        } catch (error) {
            next(error);
        }
    }

    static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await AuthService.forgotPassword(req.body);
            res.json({
                success: true,
                data: { message: 'If this email exists, a password reset link has been sent' },
            });
        } catch (error) {
            next(error);
        }
    }

    static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await AuthService.resetPassword(req.body);
            res.json({
                success: true,
                data: { message: 'Password has been reset successfully' },
            });
        } catch (error) {
            next(error);
        }
    }
}
