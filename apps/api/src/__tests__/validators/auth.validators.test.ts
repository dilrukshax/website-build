import { describe, expect, it } from 'vitest';
import {
    loginSchema,
    registerSchema,
    resetPasswordSchema,
} from '../../validators/auth.validators';

describe('auth validators', () => {
    it('accepts valid register payloads', () => {
        const parsed = registerSchema.parse({
            email: '  test@example.com  ',
            password: 'Password123',
            fullName: '  Test User  ',
            whatsappNumber: '  +94 77 123 4567  ',
        });

        expect(parsed.email).toBe('test@example.com');
        expect(parsed.fullName).toBe('Test User');
        expect(parsed.whatsappNumber).toBe('+94 77 123 4567');
    });

    it('rejects weak register password with rule-specific messages', () => {
        const parsed = registerSchema.safeParse({
            email: 'test@example.com',
            password: 'password',
            fullName: 'Test User',
            whatsappNumber: '+94 77 123 4567',
        });

        expect(parsed.success).toBe(false);
        if (!parsed.success) {
            const messages = parsed.error.issues.map((issue) => issue.message);
            expect(messages).toContain('Password must contain at least one uppercase letter');
            expect(messages).toContain('Password must contain at least one number');
        }
    });

    it('requires WhatsApp number for register payloads', () => {
        const parsed = registerSchema.safeParse({
            email: 'test@example.com',
            password: 'Password123',
            fullName: 'Test User',
            whatsappNumber: '   ',
        });

        expect(parsed.success).toBe(false);
        if (!parsed.success) {
            const messages = parsed.error.issues.map((issue) => issue.message);
            expect(messages).toContain('WhatsApp number is required');
        }
    });

    it('trims login email input', () => {
        const parsed = loginSchema.parse({
            email: '  login@example.com  ',
            password: 'any-password',
        });

        expect(parsed.email).toBe('login@example.com');
    });

    it('enforces strong password rules for reset password', () => {
        const parsed = resetPasswordSchema.safeParse({
            token: 'reset-token',
            newPassword: 'lowercaseonly',
        });

        expect(parsed.success).toBe(false);
        if (!parsed.success) {
            const messages = parsed.error.issues.map((issue) => issue.message);
            expect(messages).toContain('Password must contain at least one uppercase letter');
            expect(messages).toContain('Password must contain at least one number');
        }
    });
});
