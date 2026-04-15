import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InstancesController } from '../../controllers/instances.controller';

const mocks = vi.hoisted(() => ({
    instanceFindMany: vi.fn(),
    instanceFindUnique: vi.fn(),
    instanceFindFirst: vi.fn(),
    instanceCreate: vi.fn(),
    pageCreate: vi.fn(),
    mediaAssetFindMany: vi.fn(),
    instanceUpdate: vi.fn(),
    instanceDelete: vi.fn(),
    domainRouteFindUnique: vi.fn(),
    domainRouteFindFirst: vi.fn(),
    domainRouteUpdateMany: vi.fn(),
    domainRouteUpsert: vi.fn(),
    domainRouteDelete: vi.fn(),
    domainRouteUpdate: vi.fn(),
    dbTransaction: vi.fn(),
    tenantFindUnique: vi.fn(),
    assertCanCreateInstance: vi.fn(),
    assertCanAttachCustomDomain: vi.fn(),
    grantActivationRewardIfEligible: vi.fn(),
    rebuildAndPublish: vi.fn(),
    s3IsConfigured: vi.fn(),
    deleteInstanceArtifacts: vi.fn(),
}));

vi.mock('@booking-engine/database', () => ({
    db: {
        instance: {
            findMany: mocks.instanceFindMany,
            findUnique: mocks.instanceFindUnique,
            findFirst: mocks.instanceFindFirst,
            create: mocks.instanceCreate,
            update: mocks.instanceUpdate,
            delete: mocks.instanceDelete,
        },
        page: {
            create: mocks.pageCreate,
        },
        mediaAsset: {
            findMany: mocks.mediaAssetFindMany,
        },
        domainRoute: {
            findUnique: mocks.domainRouteFindUnique,
            findFirst: mocks.domainRouteFindFirst,
            updateMany: mocks.domainRouteUpdateMany,
            upsert: mocks.domainRouteUpsert,
            delete: mocks.domainRouteDelete,
            update: mocks.domainRouteUpdate,
        },
        tenant: {
            findUnique: mocks.tenantFindUnique,
        },
        $transaction: mocks.dbTransaction,
    },
}));

vi.mock('../../services/plan-policy.service', () => ({
    PlanPolicyService: {
        assertCanCreateInstance: mocks.assertCanCreateInstance,
        assertCanAttachCustomDomain: mocks.assertCanAttachCustomDomain,
    },
}));

vi.mock('../../services/referral-rewards.service', () => ({
    ReferralRewardsService: {
        grantActivationRewardIfEligible: mocks.grantActivationRewardIfEligible,
    },
}));

vi.mock('../../services/routing-index.service', () => ({
    RoutingIndexService: {
        rebuildAndPublish: mocks.rebuildAndPublish,
    },
}));

vi.mock('../../services/s3.service', () => ({
    S3Service: class S3ServiceMock {
        isConfigured = mocks.s3IsConfigured;
        deleteInstanceArtifacts = mocks.deleteInstanceArtifacts;
    },
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

describe('InstancesController fullDomain behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.SITE_DOMAIN = 'buildmyonlineweb.site';

        mocks.assertCanCreateInstance.mockResolvedValue(undefined);
        mocks.assertCanAttachCustomDomain.mockResolvedValue(undefined);
        mocks.grantActivationRewardIfEligible.mockResolvedValue(undefined);
        mocks.s3IsConfigured.mockReturnValue(true);
        mocks.deleteInstanceArtifacts.mockResolvedValue({
            deletedPublishedObjectCount: 2,
            deletedMediaObjectCount: 1,
            deletedTotalCount: 3,
        });
        mocks.tenantFindUnique.mockResolvedValue({ ownerId: 'owner-1' });
        mocks.pageCreate.mockResolvedValue({
            id: 'page-home',
            slug: '/',
            title: 'Home',
            instanceId: 'inst-1',
            tenantId: 'tenant-1',
            sortOrder: 0,
            seoJsonb: null,
            isPublished: false,
            createdAt: new Date('2026-03-09T10:00:00.000Z'),
            updatedAt: new Date('2026-03-09T10:00:00.000Z'),
        });
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

        mocks.dbTransaction.mockImplementation(async (callback: any) => callback({
            domainRoute: {
                findUnique: mocks.domainRouteFindUnique,
                findFirst: mocks.domainRouteFindFirst,
                updateMany: mocks.domainRouteUpdateMany,
                upsert: mocks.domainRouteUpsert,
                delete: mocks.domainRouteDelete,
                update: mocks.domainRouteUpdate,
            },
            instance: {
                update: mocks.instanceUpdate,
            },
        }));
    });

    it('computes and persists fullDomain when creating an instance', async () => {
        mocks.instanceFindUnique.mockResolvedValue(null);
        mocks.instanceCreate.mockResolvedValue({
            id: 'inst-1',
            subdomain: 'mysalon',
            fullDomain: 'mysalon.buildmyonlineweb.site',
            customDomain: null,
            name: 'My Salon',
            businessType: null,
            timezone: 'UTC',
            status: 'active',
            createdAt: new Date('2026-03-09T10:00:00.000Z'),
            updatedAt: new Date('2026-03-09T10:00:00.000Z'),
        });

        const req = {
            tenant: { id: 'tenant-1' },
            body: {
                name: 'My Salon',
                subdomain: 'MySalon',
                businessType: '',
            },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await InstancesController.create(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.instanceCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({
                tenantId: 'tenant-1',
                subdomain: 'mysalon',
                fullDomain: 'mysalon.buildmyonlineweb.site',
                name: 'My Salon',
            }),
        });
        expect(mocks.pageCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({
                tenantId: 'tenant-1',
                instanceId: 'inst-1',
                title: 'Home',
                slug: '/',
                sortOrder: 0,
            }),
        });
        expect(mocks.rebuildAndPublish).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                fullDomain: 'mysalon.buildmyonlineweb.site',
            }),
        }));
    });

    it('keeps instance creation successful when referral reward side effects fail', async () => {
        mocks.instanceFindUnique.mockResolvedValue(null);
        mocks.instanceCreate.mockResolvedValue({
            id: 'inst-2',
            subdomain: 'failingreward',
            fullDomain: 'failingreward.buildmyonlineweb.site',
            customDomain: null,
            name: 'Failing Reward',
            businessType: null,
            timezone: 'UTC',
            status: 'active',
            createdAt: new Date('2026-03-09T10:00:00.000Z'),
            updatedAt: new Date('2026-03-09T10:00:00.000Z'),
        });
        mocks.grantActivationRewardIfEligible.mockRejectedValue(new Error('referral subsystem down'));

        const req = {
            tenant: { id: 'tenant-1' },
            body: {
                name: 'Failing Reward',
                subdomain: 'failingreward',
                businessType: '',
            },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await InstancesController.create(req, res as any, next);
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                id: 'inst-2',
                fullDomain: 'failingreward.buildmyonlineweb.site',
            }),
        }));
    });

    it('returns pending custom domain compatibility state in list response by default', async () => {
        mocks.instanceFindMany.mockResolvedValue([
            {
                id: 'inst-1',
                subdomain: 'mysalon',
                fullDomain: 'mysalon.buildmyonlineweb.site',
                customDomain: 'www.clientsite.com',
                name: 'My Salon',
                businessType: 'Salon & Spa',
                timezone: 'UTC',
                status: 'active',
                createdAt: new Date('2026-03-09T10:00:00.000Z'),
                updatedAt: new Date('2026-03-09T11:00:00.000Z'),
            },
        ]);

        const req = { tenant: { id: 'tenant-1' } } as any;
        const res = createResponse();
        const next = vi.fn();

        await InstancesController.list(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: [expect.objectContaining({
                customDomain: 'www.clientsite.com',
                customDomainHostnameStatus: 'pending',
                customDomainSslStatus: 'pending',
                customDomainIsActive: false,
            })],
        }));
    });

    it('upserts domain route and sets primary customDomain when active', async () => {
        mocks.instanceFindFirst.mockResolvedValue({
            id: 'inst-1',
            fullDomain: 'mysalon.buildmyonlineweb.site',
            customDomain: null,
        });
        mocks.domainRouteFindUnique.mockResolvedValue(null);
        mocks.domainRouteUpdateMany.mockResolvedValue({ count: 0 });
        mocks.domainRouteUpsert.mockResolvedValue({
            id: 'route-1',
            instanceId: 'inst-1',
            host: 'www.clientsite.com',
            active: true,
            isPrimary: true,
            updatedAt: new Date('2026-03-09T12:00:00.000Z'),
        });
        mocks.instanceUpdate.mockResolvedValue({ id: 'inst-1' });

        const req = {
            tenant: { id: 'tenant-1' },
            params: { id: 'inst-1' },
            body: {
                host: 'www.clientsite.com',
                active: true,
                isPrimary: true,
            },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await InstancesController.upsertDomainRoute(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.domainRouteUpsert).toHaveBeenCalled();
        expect(mocks.instanceUpdate).toHaveBeenCalledWith({
            where: { id: 'inst-1' },
            data: {
                customDomain: 'www.clientsite.com',
                customDomainHostnameStatus: 'pending',
                customDomainSslStatus: 'pending',
                customDomainLastCheckedAt: null,
                customDomainActivatedAt: null,
            },
        });
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                host: 'www.clientsite.com',
                isPrimary: true,
            }),
        }));
    });

    it('removes a route and falls back to another active route', async () => {
        mocks.instanceFindFirst.mockResolvedValue({
            id: 'inst-1',
            fullDomain: 'mysalon.buildmyonlineweb.site',
            customDomain: 'www.clientsite.com',
        });
        mocks.domainRouteFindFirst
            .mockResolvedValueOnce({ id: 'route-1', isPrimary: true })
            .mockResolvedValueOnce({ id: 'route-2', host: 'clientsite.com', isPrimary: false });
        mocks.domainRouteDelete.mockResolvedValue({ id: 'route-1' });
        mocks.domainRouteUpdate.mockResolvedValue({ id: 'route-2', isPrimary: true });
        mocks.instanceUpdate.mockResolvedValue({ id: 'inst-1', customDomain: 'clientsite.com' });

        const req = {
            tenant: { id: 'tenant-1' },
            params: { id: 'inst-1', host: 'www.clientsite.com' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await InstancesController.removeDomainRoute(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.domainRouteDelete).toHaveBeenCalled();
        expect(mocks.instanceUpdate).toHaveBeenCalledWith({
            where: { id: 'inst-1' },
            data: {
                customDomain: 'clientsite.com',
                customDomainHostnameStatus: 'pending',
                customDomainSslStatus: 'pending',
                customDomainLastCheckedAt: null,
                customDomainActivatedAt: null,
            },
        });
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({ removed: true, host: 'www.clientsite.com' }),
        }));
    });

    it('deletes storage artifacts before deleting instance record', async () => {
        mocks.instanceFindFirst.mockResolvedValue({
            id: 'inst-1',
            tenantId: 'tenant-1',
            fullDomain: 'mysalon.buildmyonlineweb.site',
            customDomain: 'www.clientsite.com',
        });
        mocks.mediaAssetFindMany.mockResolvedValue([
            { objectKey: 'uploads/tenant-1/inst-1/2026/04/03/a.png' },
            { objectKey: 'uploads/tenant-1/inst-1/2026/04/03/b.png' },
        ]);
        mocks.instanceDelete.mockResolvedValue({ id: 'inst-1' });

        const req = {
            tenant: { id: 'tenant-1' },
            params: { id: 'inst-1' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await InstancesController.deactivate(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.deleteInstanceArtifacts).toHaveBeenCalledWith({
            tenantId: 'tenant-1',
            instanceId: 'inst-1',
            mediaObjectKeys: [
                'uploads/tenant-1/inst-1/2026/04/03/a.png',
                'uploads/tenant-1/inst-1/2026/04/03/b.png',
            ],
        });
        const cleanupCallOrder = mocks.deleteInstanceArtifacts.mock.invocationCallOrder[0];
        const deleteCallOrder = mocks.instanceDelete.mock.invocationCallOrder[0];
        expect(cleanupCallOrder ?? 0).toBeLessThan(deleteCallOrder ?? 0);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                message: 'Instance deleted successfully',
                storageCleanup: {
                    deletedPublishedObjectCount: 2,
                    deletedMediaObjectCount: 1,
                    deletedTotalCount: 3,
                },
            },
        });
    });

    it('fails deletion when R2 cleanup is unavailable', async () => {
        mocks.instanceFindFirst.mockResolvedValue({
            id: 'inst-1',
            tenantId: 'tenant-1',
            fullDomain: 'mysalon.buildmyonlineweb.site',
            customDomain: null,
        });
        mocks.mediaAssetFindMany.mockResolvedValue([]);
        mocks.s3IsConfigured.mockReturnValue(false);

        const req = {
            tenant: { id: 'tenant-1' },
            params: { id: 'inst-1' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await InstancesController.deactivate(req, res as any, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(mocks.instanceDelete).not.toHaveBeenCalled();
        const error = next.mock.calls[0]?.[0] as { code?: string; statusCode?: number };
        expect(error.code).toBe('INTERNAL_ERROR');
        expect(error.statusCode).toBe(500);
    });
});
