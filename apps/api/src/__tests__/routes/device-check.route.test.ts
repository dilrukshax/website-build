import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deviceCheckRouter } from '../../routes/device-check';
import { errorHandler } from '../../middleware/error';

const mocks = vi.hoisted(() => ({
    evaluateAndPersist: vi.fn(),
}));

vi.mock('../../services/device-risk.service', () => ({
    DeviceRiskService: {
        evaluateAndPersist: mocks.evaluateAndPersist,
    },
}));

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/device-check', deviceCheckRouter);
    app.use(errorHandler);
    return app;
}

const validPayload = {
    fingerprintHash: 'hash-value',
    persistentToken: 'token-value',
    components: {
        canvas: 'canvas',
        webgl: {
            vendor: 'NVIDIA',
            renderer: 'RTX',
            version: '1.0',
            shadingLanguageVersion: '1.0',
            extensions: 'EXT_a',
        },
        audioHash: 'audio-hash',
        fonts: ['Arial', 'Verdana'],
        screen: '{"width":1920,"height":1080}',
        hardware: '{"platform":"MacIntel"}',
        timezone: '{"timeZone":"Asia/Colombo"}',
    },
    evasionFlags: {
        webdriver: false,
        noPlugins: false,
        defaultResolution: false,
        phantomjs: false,
    },
};

describe('/api/device-check', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns risk response without exposing fingerprint hash', async () => {
        mocks.evaluateAndPersist.mockResolvedValue({
            riskLevel: 'medium',
            riskScore: 45,
            action: 'verify',
            flags: ['Fingerprint hash matches an existing account device'],
            deviceId: 'device-123',
        });

        const response = await request(createApp())
            .post('/api/device-check')
            .set('x-forwarded-for', '203.0.113.10')
            .send(validPayload);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual({
            riskLevel: 'medium',
            riskScore: 45,
            action: 'verify',
            flags: ['Fingerprint hash matches an existing account device'],
            deviceId: 'device-123',
        });
        expect(response.body.data.fingerprintHash).toBeUndefined();
    });

    it('returns 400 for invalid payload', async () => {
        const response = await request(createApp())
            .post('/api/device-check')
            .send({
                fingerprintHash: '',
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(mocks.evaluateAndPersist).not.toHaveBeenCalled();
    });
});
