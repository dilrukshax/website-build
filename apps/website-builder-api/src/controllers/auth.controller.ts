import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@project-aurora/auth';
import { DiscordWebhookService } from '../services/discord-webhook.service';

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
};

const ACCESS_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
};

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const registerPayload = req.body as {
                email?: string;
                fullName?: string;
                whatsappNumber?: string;
            };
            const result = await AuthService.register(req.body);

            await DiscordWebhookService.notifyUserRegistered({
                userId: result.user.id,
                email: result.user.email || registerPayload.email || '',
                fullName: result.user.fullName || registerPayload.fullName || '',
                whatsappNumber: registerPayload.whatsappNumber || null,
                ipAddress: req.ip || null,
                userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
            });

            res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
            res.cookie('accessToken', result.tokens.accessToken, ACCESS_COOKIE_OPTIONS);
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
            res.cookie('accessToken', result.tokens.accessToken, ACCESS_COOKIE_OPTIONS);
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
            res.cookie('accessToken', result.tokens.accessToken, ACCESS_COOKIE_OPTIONS);
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
            res.cookie('accessToken', tokens.accessToken, ACCESS_COOKIE_OPTIONS);
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
            res.clearCookie('accessToken', { path: '/' });
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
