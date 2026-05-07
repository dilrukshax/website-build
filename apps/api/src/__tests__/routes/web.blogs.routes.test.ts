import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { webRouter } from '../../routes/web';

const mocks = vi.hoisted(() => ({
    lookupHost: vi.fn(),
    tenantFindUnique: vi.fn(),
    instanceFindFirst: vi.fn(),
    blogFindMany: vi.fn(),
    blogFindFirst: vi.fn(),
}));

vi.mock('../../services/routing-index.service', () => ({
    RoutingIndexService: {
        lookupHost: mocks.lookupHost,
    },
}));

vi.mock('@booking-engine/database', () => ({
    db: {
        tenant: {
            findUnique: mocks.tenantFindUnique,
        },
        instance: {
            findFirst: mocks.instanceFindFirst,
        },
        blogPost: {
            findMany: mocks.blogFindMany,
            findFirst: mocks.blogFindFirst,
        },
    },
}));

function createApp() {
    const app = express();
    app.use('/web', webRouter);
    return app;
}

describe('/web/blogs routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.WEB_PROXY_SHARED_SECRET = 'shared-secret';
        process.env.SITE_DOMAIN = 'buildmyonlineweb.site';
        process.env.CMS_URL = 'https://staging.buildmyonlineweb.site';
        process.env.API_BASE_URL = 'https://staging-api.buildmyonlineweb.site';

        mocks.lookupHost.mockResolvedValue({
            instanceId: 'instance-1',
            tenantId: 'tenant-1',
            subdomain: 'mysalon',
            manifestUrl: 'https://cdn.example.com/sites/instance-1/current.json',
            active: true,
            source: 'domainRoute',
        });
        mocks.tenantFindUnique.mockResolvedValue({
            id: 'tenant-1',
            businessName: 'Tenant One',
            status: 'active',
            ownerId: 'owner-1',
        });
        mocks.instanceFindFirst.mockResolvedValue({
            id: 'instance-1',
            subdomain: 'mysalon',
            name: 'My Salon',
            status: 'active',
            timezone: 'UTC',
        });
        mocks.blogFindMany.mockResolvedValue([]);
    });

    it('resolves tenant/instance from trusted routed host for /web/blogs', async () => {
        const app = createApp();
        const response = await request(app)
            .get('/web/blogs')
            .set('x-routed-host', 'www.clientsite.com')
            .set('x-web-proxy-secret', 'shared-secret');

        expect(response.status).toBe(200);
        expect(mocks.lookupHost).toHaveBeenCalledWith('www.clientsite.com');
        expect(mocks.blogFindMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                tenantId: 'tenant-1',
                instanceId: 'instance-1',
                isPublished: true,
            }),
        }));
    });

    it('scopes /web/blogs/:slug to published records', async () => {
        mocks.blogFindFirst.mockResolvedValue(null);
        const app = createApp();
        const response = await request(app)
            .get('/web/blogs/Hello-World')
            .set('x-routed-host', 'www.clientsite.com')
            .set('x-web-proxy-secret', 'shared-secret');

        expect(response.status).toBe(404);
        expect(mocks.blogFindFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                tenantId: 'tenant-1',
                instanceId: 'instance-1',
                slug: 'hello-world',
                isPublished: true,
            }),
        }));
    });
});
