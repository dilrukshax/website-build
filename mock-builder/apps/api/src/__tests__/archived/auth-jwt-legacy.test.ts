/**
 * ARCHIVED — Legacy JWT Integration Test
 *
 * This test was written for the original custom JWT auth system.
 * It is preserved here for reference ONLY.
 *
 * The auth endpoints it tests (/api/v1/auth/register, /api/v1/auth/login, etc.)
 * have been removed. Authentication is now handled by Clerk.
 *
 * When Clerk API keys are configured, new integration tests should be written
 * using the @clerk/testing library against the /cms/* routes.
 *
 * DO NOT un-archive this test — it will fail against the new codebase.
 */

// Original test preserved as-is below for reference:

/*
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server';
import { closePool } from '@booking-engine/database';

describe('Authentication Endpoints Integration Tests', () => {
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
    });

    // ... (remaining tests archived)
});
*/
