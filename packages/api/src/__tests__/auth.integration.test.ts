import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Authentication Endpoints Integration Tests', () => {
    // Generate unique email and subdomain for each test run to avoid conflicts
    const timestamp = Date.now();
    const testEmail = `test_${timestamp}@example.com`;
    const testPassword = 'Password123!';
    const testSubdomain = `test-${timestamp}`;

    it('should successfully register a new tenant and user', async () => {
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: testEmail,
                password: testPassword,
                fullName: 'Integration Test User',
                businessName: 'Integration Business',
                businessType: 'tourism',
                subdomain: testSubdomain
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe(testEmail);
        expect(response.body.data.tenant).toBeDefined();
        expect(response.body.data.tenant.subdomain).toBe(testSubdomain);
        expect(response.body.data.tokens.accessToken).toBeDefined();
        expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should fail registration with duplicate email', async () => {
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: testEmail, // same email
                password: testPassword,
                fullName: 'Another User',
                businessName: 'Another Business',
                businessType: 'retail',
                subdomain: `test-diff-${timestamp}`
            });

        expect(response.status).toBe(409); // The AppError uses 409
        expect(response.body.success).toBe(false);
    });

    it('should fail registration with duplicate subdomain', async () => {
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: `another_${testEmail}`,
                password: testPassword,
                fullName: 'Another User',
                businessName: 'Another Business',
                businessType: 'retail',
                subdomain: testSubdomain // same subdomain
            });

        expect(response.status).toBe(409); // The AppError uses 409
        expect(response.body.success).toBe(false);
    });

    it('should log in the newly registered user', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testEmail,
                password: testPassword,
            });

        if (response.status !== 200) {
            console.error('LOGIN FAILED:', response.body);
        }
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe(testEmail);
        expect(response.body.data.tokens.accessToken).toBeDefined();
        expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should fail login with incorrect password', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testEmail,
                password: 'WrongPassword123!',
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    it('should request a password reset successfully', async () => {
        const response = await request(app)
            .post('/api/v1/auth/forgot-password')
            .send({
                email: testEmail,
            });

        // We expect a 200 OK whether the email exists or not (security best practice)
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain('If this email is registered');
    });

    it('should fail reset password with invalid token', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({
                token: 'invalid-or-fake-token-12345',
                newPassword: 'NewPassword123!'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors[0].message).toContain('Invalid or expired reset token');
    });
});
