import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(255),
    businessName: z.string().min(2, 'Business name must be at least 2 characters').max(255),
    businessType: z.string().min(2).max(100),
    subdomain: z.string()
        .min(3, 'Subdomain must be at least 3 characters')
        .max(63)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Subdomain must be lowercase alphanumeric with hyphens'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
