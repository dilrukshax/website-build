import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    findFirst: vi.fn(),
}));

vi.mock('@booking-engine/database', () => ({
    db: {
        instance: {
            findFirst: mocks.findFirst,
        },
    },
}));

vi.mock('../services/plan-policy.service', () => ({
    PlanPolicyService: {},
}));

vi.mock('../services/referral-rewards.service', () => ({
    ReferralRewardsService: {},
}));

vi.mock('../services/routing-index.service', () => ({
    RoutingIndexService: {},
}));

vi.mock('@booking-engine/core', () => ({
    ERROR_CODES: {
        NOT_FOUND: 'NOT_FOUND',
    },
    sanitizeSubdomain: (value: string) => value,
}));

import { InstancesController } from '../../controllers/instances.controller';

function createReq(overrides?: Partial<Record<string, unknown>>) {
    return {
        tenant: { id: 'tenant-1' },
        params: { id: 'inst-1' },
        body: {},
        ...overrides,
    } as any;
}

function createRes() {
    const res: any = {};
    res.json = vi.fn(() => res);
    return res;
}

describe('InstancesController legacy custom-domain compatibility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('handles legacy custom-domain handler even when called as unbound callback', async () => {
        const req = createReq({
            body: {
                customDomain: 'www.clientsite.com',
            },
        });
        const res = createRes();
        const next = vi.fn();

        const upsertSpy = vi.spyOn(InstancesController, 'upsertDomainRoute')
            .mockResolvedValue(undefined);

        await InstancesController.updateCustomDomainLegacy.call(undefined, req, res, next);

        expect(req.body).toEqual({
            host: 'www.clientsite.com',
            active: true,
            isPrimary: true,
        });
        expect(upsertSpy).toHaveBeenCalledTimes(1);
        expect(upsertSpy).toHaveBeenCalledWith(req, res, next);

        upsertSpy.mockRestore();
    });

    it('returns setup/status payload from stored customDomain for legacy status endpoint', async () => {
        mocks.findFirst.mockResolvedValue({
            id: 'inst-1',
            subdomain: 'mysalon',
            fullDomain: 'mysalon.buildmyonlineweb.site',
            customDomain: 'www.clientsite.com',
            updatedAt: '2026-03-16T00:00:00.000Z',
        });

        const req = createReq();
        const res = createRes();
        const next = vi.fn();

        await InstancesController.getCustomDomainStatusLegacy(req, res, next);

        expect(mocks.findFirst).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledTimes(1);
        const payload = res.json.mock.calls[0]?.[0];
        expect(payload.success).toBe(true);
        expect(payload.data.customDomain).toBe('www.clientsite.com');
        expect(payload.data.status).toBe('active');
        expect(payload.data.cnameTarget).toBe('mysalon.buildmyonlineweb.site');
    });

    it('returns setup payload for legacy setup endpoint', async () => {
        mocks.findFirst.mockResolvedValue({
            id: 'inst-1',
            subdomain: 'mysalon',
            fullDomain: 'mysalon.buildmyonlineweb.site',
            customDomain: 'www.clientsite.com',
            updatedAt: '2026-03-16T00:00:00.000Z',
        });

        const req = createReq();
        const res = createRes();
        const next = vi.fn();

        await InstancesController.getCustomDomainSetupLegacy(req, res, next);

        expect(res.json).toHaveBeenCalledTimes(1);
        const payload = res.json.mock.calls[0]?.[0];
        expect(payload.success).toBe(true);
        expect(payload.data.customDomain).toBe('www.clientsite.com');
        expect(payload.data.verification).toEqual([]);
    });
});
