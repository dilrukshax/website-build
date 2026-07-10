import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ERROR_CODES } from '@project-aurora/core';
import { AppError, errorHandler } from '../../middleware/error';

function createTestApp() {
    const app = express();

    app.get('/local-app-error', (_req, _res, next) => {
        next(new AppError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', 400, 'email'));
    });

    app.get('/external-app-error', (_req, _res, next) => {
        const externalError = Object.assign(
            new Error('A user with this email already exists'),
            {
                code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
                statusCode: 409,
                field: 'email',
            },
        );
        next(externalError);
    });

    app.get('/prisma-email-unique', (_req, _res, next) => {
        const prismaError = Object.assign(
            new Error('Unique constraint failed on the fields: (`email`)'),
            {
                code: 'P2002',
                meta: { target: ['email'] },
            },
        );
        next(prismaError);
    });

    app.get('/prisma-generic-unique', (_req, _res, next) => {
        const prismaError = Object.assign(
            new Error('Unique constraint failed'),
            {
                code: 'P2002',
                meta: { target: ['slug'] },
            },
        );
        next(prismaError);
    });

    app.get('/prisma-init', (_req, _res, next) => {
        const prismaInitError = Object.assign(
            new Error("Can't reach database server"),
            {
                name: 'PrismaClientInitializationError',
                code: 'P1001',
            },
        );
        next(prismaInitError);
    });

    app.use(errorHandler);
    return app;
}

describe('error middleware', () => {
    it('returns structured response for local AppError instances', async () => {
        const app = createTestApp();
        const response = await request(app).get('/local-app-error');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Validation failed',
                field: 'email',
            },
        });
    });

    it('returns structured response for external AppError-like objects', async () => {
        const app = createTestApp();
        const response = await request(app).get('/external-app-error');

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
                message: 'A user with this email already exists',
                field: 'email',
            },
        });
    });

    it('maps Prisma P2002 email constraint to EMAIL_ALREADY_EXISTS', async () => {
        const app = createTestApp();
        const response = await request(app).get('/prisma-email-unique');

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
                message: 'A user with this email already exists',
                field: 'email',
            },
        });
    });

    it('maps Prisma P2002 non-email constraint to VALIDATION_ERROR', async () => {
        const app = createTestApp();
        const response = await request(app).get('/prisma-generic-unique');

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'A record with this value already exists',
                field: 'slug',
            },
        });
    });

    it('maps Prisma initialization errors to DATABASE_ERROR with 503', async () => {
        const app = createTestApp();
        const response = await request(app).get('/prisma-init');

        expect(response.status).toBe(503);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: ERROR_CODES.DATABASE_ERROR,
                message: 'Database is temporarily unavailable. Please try again in a moment.',
            },
        });
    });
});
