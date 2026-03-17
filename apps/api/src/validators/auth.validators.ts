import { z } from 'zod';

const emailSchema = z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address');

const strongPasswordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
    email: emailSchema,
    password: strongPasswordSchema,
    fullName: z.string().trim().min(1, 'Full name is required').max(255, 'Full name is too long'),
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
    refreshToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: strongPasswordSchema,
});

export const switchTenantSchema = z.object({
    tenantId: z.string().uuid('Invalid tenant ID'),
});
