import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BlogsController } from '../../controllers/blogs.controller';

const mocks = vi.hoisted(() => ({
    blogFindMany: vi.fn(),
    blogFindFirst: vi.fn(),
    blogCreate: vi.fn(),
    blogUpdate: vi.fn(),
    instanceFindFirst: vi.fn(),
    invalidatePublishedSiteCache: vi.fn(),
}));

vi.mock('@booking-engine/database', () => ({
    db: {
        blogPost: {
            findMany: mocks.blogFindMany,
            findFirst: mocks.blogFindFirst,
            create: mocks.blogCreate,
            update: mocks.blogUpdate,
        },
        instance: {
            findFirst: mocks.instanceFindFirst,
        },
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

describe('BlogsController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.invalidatePublishedSiteCache.mockResolvedValue({
            hosts: [],
            attempted: 0,
            purged: 0,
            failed: [],
            files: [],
            filesAttempted: 0,
            filesPurged: 0,
            filesFailed: [],
        });
    });

    it('scopes CMS listing to current tenant and instance', async () => {
        mocks.blogFindMany.mockResolvedValue([]);

        const req = {
            tenant: { id: 'tenant-1' },
            instance: { id: 'instance-1' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await BlogsController.listCms(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.blogFindMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                tenantId: 'tenant-1',
                instanceId: 'instance-1',
            },
        }));
    });

    it('scopes public listing to published posts only', async () => {
        mocks.blogFindMany.mockResolvedValue([]);

        const req = {
            tenant: { id: 'tenant-1' },
            instance: { id: 'instance-1' },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await BlogsController.listPublic(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.blogFindMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                tenantId: 'tenant-1',
                instanceId: 'instance-1',
                isPublished: true,
            },
        }));
    });

    it('sanitizes HTML and sets publish timestamp on create when publishing', async () => {
        mocks.blogFindFirst.mockResolvedValueOnce(null);
        mocks.instanceFindFirst.mockResolvedValue({
            subdomain: 'mysalon',
            fullDomain: 'mysalon.example.com',
            customDomain: 'www.mysalon.com',
        });
        mocks.blogCreate.mockResolvedValue({
            id: 'blog-1',
            title: 'Post',
            slug: 'post',
            contentHtml: '<p>Hello</p>',
            isPublished: true,
            publishedAt: new Date('2026-04-17T08:30:00.000Z'),
        });

        const req = {
            tenant: { id: 'tenant-1' },
            instance: { id: 'instance-1' },
            body: {
                title: 'Post',
                slug: 'post',
                contentHtml: '<p>Hello</p><script>alert(1)</script>',
                isPublished: true,
                publishedAt: '2026-04-17T08:30:00.000Z',
            },
        } as any;
        const res = createResponse();
        const next = vi.fn();

        await BlogsController.create(req, res as any, next);

        expect(next).not.toHaveBeenCalled();
        expect(mocks.blogCreate).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                tenantId: 'tenant-1',
                instanceId: 'instance-1',
                slug: 'post',
                isPublished: true,
                publishedAt: new Date('2026-04-17T08:30:00.000Z'),
                contentHtml: '<p>Hello</p>',
            }),
        }));
        expect(mocks.instanceFindFirst).toHaveBeenCalledWith({
            where: {
                id: 'instance-1',
                tenantId: 'tenant-1',
            },
            select: {
                subdomain: true,
                fullDomain: true,
                customDomain: true,
            },
        });
        expect(mocks.invalidatePublishedSiteCache).toHaveBeenCalledWith({
            action: 'blog',
            subdomain: 'mysalon',
            fullDomain: 'mysalon.example.com',
            customDomain: 'www.mysalon.com',
            version: 0,
        });
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
