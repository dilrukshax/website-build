import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    findFirst: vi.fn(),
    update: vi.fn(),
    checkCustomDomainNameservers: vi.fn(),
}));

vi.mock('@project-aurora/database', () => ({
    db: {
        instance: {
            findFirst: mocks.findFirst,
            update: mocks.update,
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

vi.mock('@project-aurora/core', () => ({
    ERROR_CODES: {
        NOT_FOUND: 'NOT_FOUND',
    },
    sanitizeSubdomain: (value: string) => value,
}));

vi.mock('../../utils/domain-nameservers', () => ({
    checkCustomDomainNameservers: mocks.checkCustomDomainNameservers,
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
            customDomainHostnameStatus: 'active',
            customDomainSslStatus: 'active',
            customDomainLastCheckedAt: '2026-03-16T00:00:00.000Z',
            customDomainActivatedAt: '2026-03-16T00:00:00.000Z',
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
            customDomainHostnameStatus: 'active',
            customDomainSslStatus: 'active',
            customDomainLastCheckedAt: '2026-03-16T00:00:00.000Z',
            customDomainActivatedAt: '2026-03-16T00:00:00.000Z',
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

    it('checks custom-domain nameservers using live DNS endpoint', async () => {
        mocks.findFirst.mockResolvedValue({
            id: 'inst-1',
            subdomain: 'mysalon',
            fullDomain: 'mysalon.buildmyonlineweb.site',
            customDomain: 'www.clientsite.com',
            updatedAt: '2026-03-16T00:00:00.000Z',
        });
        mocks.checkCustomDomainNameservers.mockResolvedValue({
            hostname: 'www.clientsite.com',
            lookupHost: 'clientsite.com',
            requiredNameservers: ['luciana.ns.cloudflare.com', 'miles.ns.cloudflare.com'],
            actualNameservers: ['luciana.ns.cloudflare.com', 'miles.ns.cloudflare.com'],
            missingNameservers: [],
            matchesRequired: true,
            code: null,
        });
        mocks.update.mockResolvedValue({ id: 'inst-1' });

        const req = createReq();
        const res = createRes();
        const next = vi.fn();

        await InstancesController.checkCustomDomainConnection(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.checkCustomDomainNameservers).toHaveBeenCalledWith('www.clientsite.com');
        expect(mocks.update).toHaveBeenCalledWith({
            where: { id: 'inst-1' },
            data: expect.objectContaining({
                customDomainHostnameStatus: 'active',
                customDomainSslStatus: 'active',
                customDomainLastCheckedAt: expect.any(Date),
                customDomainActivatedAt: expect.any(Date),
            }),
        });

        const payload = res.json.mock.calls[0]?.[0];
        expect(payload.success).toBe(true);
        expect(payload.data.hostname).toBe('www.clientsite.com');
        expect(payload.data.lookupHost).toBe('clientsite.com');
        expect(payload.data.isActive).toBe(true);
        expect(payload.data.missingNameservers).toEqual([]);
        expect(payload.data.verificationSource).toBe('live-dns');
    });
});
