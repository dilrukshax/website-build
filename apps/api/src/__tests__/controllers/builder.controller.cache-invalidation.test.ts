import { logger } from '@booking-engine/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BuilderController } from '../../controllers/builder.controller';

const mocks = vi.hoisted(() => ({
    instanceFindUnique: vi.fn(),
    pageFindMany: vi.fn(),
    pageSectionFindMany: vi.fn(),
    pageUpdateMany: vi.fn(),
    publishFindFirst: vi.fn(),
    publishCreate: vi.fn(),
    publishUpdateMany: vi.fn(),
    publishUpdate: vi.fn(),
    uploadPublishedWebsite: vi.fn(),
    rebuildAndPublish: vi.fn(),
    invalidatePublishedSiteCache: vi.fn(),
    getEffectiveLimits: vi.fn(),
}));

vi.mock('@booking-engine/database', () => ({
    db: {
        instance: {
            findUnique: mocks.instanceFindUnique,
        },
        page: {
            findMany: mocks.pageFindMany,
            updateMany: mocks.pageUpdateMany,
        },
        pageSection: {
            findMany: mocks.pageSectionFindMany,
        },
        publishRecord: {
            findFirst: mocks.publishFindFirst,
            create: mocks.publishCreate,
            updateMany: mocks.publishUpdateMany,
            update: mocks.publishUpdate,
        },
    },
}));

vi.mock('../../services/plan-policy.service', () => ({
    PlanPolicyService: {
        getEffectiveLimits: mocks.getEffectiveLimits,
    },
}));

vi.mock('../../services/s3.service', () => ({
    S3Service: class S3ServiceMock {
        uploadPublishedWebsite = mocks.uploadPublishedWebsite;
    },
}));

vi.mock('../../services/routing-index.service', () => ({
    RoutingIndexService: {
        rebuildAndPublish: mocks.rebuildAndPublish,
    },
}));

vi.mock('../../services/publish-cache-invalidation.service', () => ({
    invalidatePublishedSiteCache: mocks.invalidatePublishedSiteCache,
}));

function createResponse() {
    const res: {
        status: ReturnType<typeof vi.fn>;
        json: ReturnType<typeof vi.fn>;
    } = {
        status: vi.fn(),
        json: vi.fn(),
    };

    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);

    return res;
}

describe('BuilderController cache invalidation integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.uploadPublishedWebsite.mockResolvedValue(undefined);
        mocks.rebuildAndPublish.mockResolvedValue({
            pointer: {
                version: 'v-1',
                generatedAt: new Date().toISOString(),
                indexKey: 'routing-index/v-1.json',
                indexUrl: 'https://cdn.example.com/routing-index/v-1.json',
                hostCount: 1,
            },
            index: { version: 'v-1', generatedAt: new Date().toISOString(), hosts: {} },
            changedHosts: [],
        });
        mocks.invalidatePublishedSiteCache.mockResolvedValue({
            hosts: [],
            attempted: 0,
            purged: 0,
            failed: [],
        });
        mocks.pageSectionFindMany.mockResolvedValue([]);
        mocks.getEffectiveLimits.mockResolvedValue({
            plan: 'free',
            maxAccessibleThemes: 10,
        });
    });

    it('triggers invalidation after successful publish upload', async () => {
        const now = new Date('2026-03-09T08:30:00.000Z');

        mocks.instanceFindUnique.mockResolvedValue({
            id: 'inst-1',
            tenantId: 'tenant-1',
            subdomain: 'mysalon',
            customDomain: 'www.mysalon.com',
            settingsJsonb: null,
        });
        mocks.pageFindMany.mockResolvedValue([
            {
                id: 'page-1',
                slug: '/',
                title: 'Home',
                sections: [],
            },
        ]);
        mocks.publishFindFirst.mockResolvedValue({ version: 1 });
        mocks.publishCreate.mockResolvedValue({
            id: 'pub-2',
            version: 2,
            status: 'published',
            publishedAt: now,
            manifestJsonb: {
                subdomain: 'mysalon',
                pages: [{ page: { slug: '/' }, sections: [] }],
            },
        });
        mocks.pageUpdateMany.mockResolvedValue({ count: 1 });

        const req = {
            instance: { id: 'inst-1' },
            tenant: { id: 'tenant-1' },
            auth: { userId: 'user-1' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await BuilderController.publish(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.uploadPublishedWebsite).toHaveBeenCalledTimes(1);
        expect(mocks.rebuildAndPublish).toHaveBeenCalledTimes(1);
        expect(mocks.invalidatePublishedSiteCache).toHaveBeenCalledTimes(1);
        expect(mocks.invalidatePublishedSiteCache).toHaveBeenCalledWith({
            action: 'publish',
            subdomain: 'mysalon',
            fullDomain: null,
            customDomain: 'www.mysalon.com',
            manifest: expect.any(Object),
            version: 2,
        });

        const uploadCallOrder = mocks.uploadPublishedWebsite.mock.invocationCallOrder[0];
        const invalidateCallOrder = mocks.invalidatePublishedSiteCache.mock.invocationCallOrder[0];
        expect(uploadCallOrder).toBeDefined();
        expect(invalidateCallOrder).toBeDefined();
        expect(uploadCallOrder ?? 0).toBeLessThan(invalidateCallOrder ?? 0);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('blocks publish when premium themes are present on a restricted plan', async () => {
        mocks.instanceFindUnique.mockResolvedValue({
            id: 'inst-1',
            tenantId: 'tenant-1',
            subdomain: 'mysalon',
            customDomain: null,
            settingsJsonb: null,
        });
        mocks.pageSectionFindMany.mockResolvedValue([
            {
                theme: {
                    id: 'theme-pricing',
                    name: 'Pricing Plans',
                    componentKey: 'pricing/v1',
                    accessRank: 12,
                },
            },
        ]);

        const req = {
            instance: { id: 'inst-1' },
            tenant: { id: 'tenant-1' },
            auth: { userId: 'user-1' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await BuilderController.publish(req, res as any, next);

        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0]?.[0] as { code?: string; statusCode?: number; message?: string };
        expect(error.code).toBe('PLAN_LIMIT_REACHED');
        expect(error.statusCode).toBe(403);
        expect(error.message).toContain('premium themes');
        expect(mocks.pageFindMany).not.toHaveBeenCalled();
        expect(mocks.uploadPublishedWebsite).not.toHaveBeenCalled();
    });

    it('triggers invalidation after successful rollback upload', async () => {
        const now = new Date('2026-03-09T08:45:00.000Z');

        mocks.publishFindFirst.mockResolvedValue({
            id: 'pub-2',
            version: 2,
            manifestJsonb: {
                subdomain: 'mysalon',
                pages: [{ page: { slug: '/' }, sections: [] }],
            },
        });
        mocks.publishUpdateMany.mockResolvedValue({ count: 1 });
        mocks.publishUpdate.mockResolvedValue({
            id: 'pub-2',
            version: 2,
            status: 'published',
            publishedAt: now,
        });
        mocks.instanceFindUnique.mockResolvedValue({
            id: 'inst-1',
            subdomain: 'mysalon',
            customDomain: 'www.mysalon.com',
        });

        const req = {
            instance: { id: 'inst-1' },
            body: { version: 2 },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await BuilderController.rollback(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.uploadPublishedWebsite).toHaveBeenCalledTimes(1);
        expect(mocks.rebuildAndPublish).toHaveBeenCalledTimes(1);
        expect(mocks.invalidatePublishedSiteCache).toHaveBeenCalledTimes(1);
        expect(mocks.invalidatePublishedSiteCache).toHaveBeenCalledWith({
            action: 'rollback',
            subdomain: 'mysalon',
            fullDomain: null,
            customDomain: 'www.mysalon.com',
            manifest: expect.any(Object),
            version: 2,
        });

        const uploadCallOrder = mocks.uploadPublishedWebsite.mock.invocationCallOrder[0];
        const invalidateCallOrder = mocks.invalidatePublishedSiteCache.mock.invocationCallOrder[0];
        expect(uploadCallOrder).toBeDefined();
        expect(invalidateCallOrder).toBeDefined();
        expect(uploadCallOrder ?? 0).toBeLessThan(invalidateCallOrder ?? 0);
    });

    it('keeps publish successful when invalidation fails (fail-open)', async () => {
        const now = new Date('2026-03-09T09:00:00.000Z');
        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => logger);

        mocks.instanceFindUnique.mockResolvedValue({
            id: 'inst-1',
            tenantId: 'tenant-1',
            subdomain: 'mysalon',
            customDomain: null,
            settingsJsonb: null,
        });
        mocks.pageFindMany.mockResolvedValue([
            {
                id: 'page-1',
                slug: '/',
                title: 'Home',
                sections: [],
            },
        ]);
        mocks.publishFindFirst.mockResolvedValue({ version: 0 });
        mocks.publishCreate.mockResolvedValue({
            id: 'pub-1',
            version: 1,
            status: 'published',
            publishedAt: now,
            manifestJsonb: {
                subdomain: 'mysalon',
                pages: [{ page: { slug: '/' }, sections: [] }],
            },
        });
        mocks.pageUpdateMany.mockResolvedValue({ count: 1 });
        mocks.invalidatePublishedSiteCache.mockRejectedValue(new Error('cache purge failed'));

        const req = {
            instance: { id: 'inst-1' },
            tenant: { id: 'tenant-1' },
            auth: { userId: 'user-1' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await BuilderController.publish(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(
            'Cache invalidation failed after publish (fail-open)',
            expect.objectContaining({
                instanceId: 'inst-1',
                subdomain: 'mysalon',
                version: 1,
            }),
        );
        warnSpy.mockRestore();
    });

    it('purges cache manually for the current instance', async () => {
        mocks.instanceFindUnique.mockResolvedValue({
            subdomain: 'mysalon',
            customDomain: 'www.mysalon.com',
        });
        mocks.invalidatePublishedSiteCache.mockResolvedValue({
            hosts: ['mysalon.buildmyonlineweb.site', 'www.mysalon.com'],
            attempted: 2,
            purged: 2,
            failed: [],
        });

        const req = {
            instance: { id: 'inst-1' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await BuilderController.purgeCache(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.invalidatePublishedSiteCache).toHaveBeenCalledWith(
            {
                action: 'manual',
                subdomain: 'mysalon',
                fullDomain: null,
                customDomain: 'www.mysalon.com',
                version: 0,
            },
            { failOpen: false },
        );
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                subdomain: 'mysalon',
                hosts: ['mysalon.buildmyonlineweb.site', 'www.mysalon.com'],
                attempted: 2,
                purged: 2,
                failed: [],
            },
        });
    });

    it('fails manual purge when cache invalidation fails (fail-closed)', async () => {
        mocks.instanceFindUnique.mockResolvedValue({
            subdomain: 'mysalon',
            customDomain: null,
        });
        mocks.invalidatePublishedSiteCache.mockRejectedValue(new Error('Cloudflare service not configured'));

        const req = {
            instance: { id: 'inst-1' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await BuilderController.purgeCache(req, res as any, next);

        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0]?.[0] as { code?: string; statusCode?: number; message?: string };
        expect(error.code).toBe('PUBLISH_FAILED');
        expect(error.statusCode).toBe(502);
        expect(error.message).toBe('Cloudflare service not configured');
    });
});
