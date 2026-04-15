import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authRouter } from '../../routes/auth';
import { errorHandler } from '../../middleware/error';

const mocks = vi.hoisted(() => ({
    register: vi.fn(),
}));

vi.mock('@booking-engine/auth', () => ({
    authMiddleware: (_req: unknown, _res: unknown, next: () => void) => next(),
    AuthService: {
        register: mocks.register,
        login: vi.fn(),
        switchTenant: vi.fn(),
        refreshToken: vi.fn(),
        getCurrentUser: vi.fn(),
        logout: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
    },
}));

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    app.use(errorHandler);
    return app;
}

describe('/auth/register compatibility with optional fingerprint payload', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.register.mockResolvedValue({
            tokens: {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            },
            user: {
                id: 'user-1',
                email: 'test@example.com',
                fullName: 'Test User',
            },
        });
    });

    it('keeps registration successful without fingerprint data', async () => {
        const response = await request(createApp())
            .post('/auth/register')
            .send({
                email: 'test@example.com',
                password: 'Password123!',
                fullName: 'Test User',
                whatsappNumber: '+94 77 123 4567',
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(mocks.register).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'Password123!',
            fullName: 'Test User',
            whatsappNumber: '+94 77 123 4567',
        });
    });

    it('ignores additive fingerprint payload keys and still succeeds', async () => {
        const response = await request(createApp())
            .post('/auth/register')
            .send({
                email: 'test2@example.com',
                password: 'Password123!',
                fullName: 'Test User',
                whatsappNumber: '+94 77 123 4568',
                _deviceFingerprint: {
                    fingerprintHash: 'abc123',
                },
                referralCode: 'REF12345',
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(mocks.register).toHaveBeenCalledWith({
            email: 'test2@example.com',
            password: 'Password123!',
            fullName: 'Test User',
            whatsappNumber: '+94 77 123 4568',
        });
    });
});
