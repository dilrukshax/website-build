import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsController } from '../../controllers/analytics.controller';

const mocks = vi.hoisted(() => ({
    instanceFindUnique: vi.fn(),
    ga4ServiceAccountJson: vi.fn(() => '{"client_email":"x@y.iam.gserviceaccount.com","private_key":"key"}'),
    getAnalyticsSummary: vi.fn(),
}));

vi.mock('@project-aurora/database', () => ({
    db: {
        instance: {
            findUnique: mocks.instanceFindUnique,
        },
    },
}));

vi.mock('../../services/ga4.service', () => ({
    getAnalyticsSummary: mocks.getAnalyticsSummary,
    isGa4ConfiguredServerSide: () => Boolean(mocks.ga4ServiceAccountJson()),
}));

vi.mock('../../lib/env', () => ({
    env: {
        ga4ServiceAccountJson: () => mocks.ga4ServiceAccountJson(),
    },
}));

function createResponse() {
    const res = {
        status: vi.fn(),
        json: vi.fn(),
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res as any;
}

function createRequest(overrides: Record<string, unknown> = {}) {
    return {
        instance: { id: 'instance-1' },
        query: { startDate: '2026-01-01', endDate: '2026-01-30' },
        ...overrides,
    } as unknown as Parameters<typeof AnalyticsController.getSummary>[0];
}

const SAMPLE_SUMMARY = {
    configured: true,
    range: { startDate: '2026-01-01', endDate: '2026-01-30' },
    totals: { sessions: 100, users: 80, avgSessionDuration: 42 },
    byDate: [],
    bySource: [],
    topPages: [],
    byDevice: [],
};

describe('AnalyticsController.getSummary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.ga4ServiceAccountJson.mockReturnValue('{"client_email":"x@y.iam.gserviceaccount.com","private_key":"key"}');
    });

    it('returns configured:false when the instance has no GA4 property id', async () => {
        mocks.instanceFindUnique.mockResolvedValue({
            settingsJsonb: { analytics: { ga4MeasurementId: 'G-XXXX', ga4PropertyId: null } },
        });

        const res = createResponse();
        await AnalyticsController.getSummary(createRequest(), res, vi.fn());

        expect(mocks.getAnalyticsSummary).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({ configured: false, reason: 'missing_property_id' }),
            }),
        );
    });

    it('returns configured:false when server credentials are missing', async () => {
        mocks.ga4ServiceAccountJson.mockReturnValue('');
        mocks.instanceFindUnique.mockResolvedValue({
            settingsJsonb: { analytics: { ga4MeasurementId: 'G-XXXX', ga4PropertyId: '123' } },
        });

        const res = createResponse();
        await AnalyticsController.getSummary(createRequest(), res, vi.fn());

        expect(mocks.getAnalyticsSummary).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ configured: false, reason: 'missing_server_credentials' }),
            }),
        );
    });

    it('returns the GA4 summary when configured', async () => {
        mocks.instanceFindUnique.mockResolvedValue({
            settingsJsonb: { analytics: { ga4MeasurementId: 'G-XXXX', ga4PropertyId: '123456789' } },
        });
        mocks.getAnalyticsSummary.mockResolvedValue(SAMPLE_SUMMARY);

        const res = createResponse();
        await AnalyticsController.getSummary(createRequest(), res, vi.fn());

        expect(mocks.getAnalyticsSummary).toHaveBeenCalledWith('123456789', '2026-01-01', '2026-01-30');
        expect(res.json).toHaveBeenCalledWith({ success: true, data: SAMPLE_SUMMARY });
    });

    it('fails open when the GA4 service throws', async () => {
        mocks.instanceFindUnique.mockResolvedValue({
            settingsJsonb: { analytics: { ga4MeasurementId: 'G-XXXX', ga4PropertyId: '123456789' } },
        });
        mocks.getAnalyticsSummary.mockRejectedValue(new Error('boom'));

        const res = createResponse();
        await AnalyticsController.getSummary(createRequest(), res, vi.fn());

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ configured: false, reason: 'fetch_error' }),
            }),
        );
    });

    it('returns 404 when the instance does not exist', async () => {
        mocks.instanceFindUnique.mockResolvedValue(null);

        const res = createResponse();
        await AnalyticsController.getSummary(createRequest(), res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
