import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolvePublicWebContext } from '../../middleware/public-web-context';

const mocks = vi.hoisted(() => ({
    lookupHost: vi.fn(),
}));

vi.mock('../../services/routing-index.service', () => ({
    RoutingIndexService: {
        lookupHost: mocks.lookupHost,
    },
}));

function createReq(headers: Record<string, string> = {}) {
    return {
        headers: { ...headers },
    } as any;
}

describe('resolvePublicWebContext middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.WEB_PROXY_SHARED_SECRET = 'shared-secret';
        process.env.SITE_DOMAIN = 'buildmyonlineweb.site';
        process.env.CMS_URL = 'https://staging.buildmyonlineweb.site';
        process.env.API_BASE_URL = 'https://staging-api.buildmyonlineweb.site';
        delete process.env.PLATFORM_HOST_BYPASS;
        delete process.env.NEXT_PUBLIC_PLATFORM_HOST_BYPASS;
    });

    it('injects legacy tenant/instance headers from trusted routed host lookup', async () => {
        mocks.lookupHost.mockResolvedValue({
            instanceId: 'instance-1',
            tenantId: 'tenant-1',
            subdomain: 'mysalon',
            manifestUrl: 'https://cdn.example.com/sites/instance-1/current.json',
            active: true,
            source: 'domainRoute',
        });

        const req = createReq({
            'x-routed-host': 'WWW.ClientSite.COM:443',
            'x-web-proxy-secret': 'shared-secret',
        });
        const next = vi.fn();

        await resolvePublicWebContext(req, {} as any, next);

        expect(mocks.lookupHost).toHaveBeenCalledWith('www.clientsite.com');
        expect(req.headers['x-tenant-id']).toBe('tenant-1');
        expect(req.headers['x-instance-id']).toBe('instance-1');
        expect(next).toHaveBeenCalledWith();
    });

    it('ignores routed host when proxy secret is invalid and preserves legacy headers', async () => {
        const req = createReq({
            'x-routed-host': 'www.clientsite.com',
            'x-web-proxy-secret': 'wrong-secret',
            'x-tenant-id': 'legacy-tenant',
            'x-instance-id': 'legacy-instance',
        });
        const next = vi.fn();

        await resolvePublicWebContext(req, {} as any, next);

        expect(mocks.lookupHost).not.toHaveBeenCalled();
        expect(req.headers['x-tenant-id']).toBe('legacy-tenant');
        expect(req.headers['x-instance-id']).toBe('legacy-instance');
        expect(next).toHaveBeenCalledWith();
    });

    it('does not inject headers when trusted host is not found in routing index', async () => {
        mocks.lookupHost.mockResolvedValue(null);

        const req = createReq({
            'x-routed-host': 'unknown-client.com',
            'x-web-proxy-secret': 'shared-secret',
        });
        const next = vi.fn();

        await resolvePublicWebContext(req, {} as any, next);

        expect(mocks.lookupHost).toHaveBeenCalledWith('unknown-client.com');
        expect(req.headers['x-tenant-id']).toBeUndefined();
        expect(req.headers['x-instance-id']).toBeUndefined();
        expect(next).toHaveBeenCalledWith();
    });

    it('injects headers in compatibility mode when shared secret is not configured', async () => {
        delete process.env.WEB_PROXY_SHARED_SECRET;
        mocks.lookupHost.mockResolvedValue({
            instanceId: 'instance-1',
            tenantId: 'tenant-1',
            subdomain: 'mysalon',
            manifestUrl: 'https://cdn.example.com/sites/instance-1/current.json',
            active: true,
            source: 'domainRoute',
        });
        const req = createReq({
            'x-routed-host': 'www.clientsite.com',
        });
        const next = vi.fn();

        await resolvePublicWebContext(req, {} as any, next);

        expect(mocks.lookupHost).toHaveBeenCalledWith('www.clientsite.com');
        expect(req.headers['x-tenant-id']).toBe('tenant-1');
        expect(req.headers['x-instance-id']).toBe('instance-1');
        expect(next).toHaveBeenCalledWith();
    });

    it('preserves legacy headers in compatibility mode when request already has context', async () => {
        delete process.env.WEB_PROXY_SHARED_SECRET;
        const req = createReq({
            'x-routed-host': 'www.clientsite.com',
            'x-tenant-id': 'legacy-tenant',
            'x-instance-id': 'legacy-instance',
        });
        const next = vi.fn();

        await resolvePublicWebContext(req, {} as any, next);

        expect(mocks.lookupHost).not.toHaveBeenCalled();
        expect(req.headers['x-tenant-id']).toBe('legacy-tenant');
        expect(req.headers['x-instance-id']).toBe('legacy-instance');
        expect(next).toHaveBeenCalledWith();
    });

    it('skips routed-host lookup for reserved platform hosts from CMS/API URLs', async () => {
        const req = createReq({
            'x-routed-host': 'staging-api.buildmyonlineweb.site',
            'x-web-proxy-secret': 'shared-secret',
        });
        const next = vi.fn();

        await resolvePublicWebContext(req, {} as any, next);

        expect(mocks.lookupHost).not.toHaveBeenCalled();
        expect(req.headers['x-tenant-id']).toBeUndefined();
        expect(req.headers['x-instance-id']).toBeUndefined();
        expect(next).toHaveBeenCalledWith();
    });

    it('skips routed-host lookup for PLATFORM_HOST_BYPASS entries', async () => {
        process.env.PLATFORM_HOST_BYPASS = 'preview.internal.example.com';

        const req = createReq({
            'x-routed-host': 'preview.internal.example.com',
            'x-web-proxy-secret': 'shared-secret',
        });
        const next = vi.fn();

        await resolvePublicWebContext(req, {} as any, next);

        expect(mocks.lookupHost).not.toHaveBeenCalled();
        expect(req.headers['x-tenant-id']).toBeUndefined();
        expect(req.headers['x-instance-id']).toBeUndefined();
        expect(next).toHaveBeenCalledWith();
    });

    it('skips routed-host lookup for default reserved staging host without explicit bypass env', async () => {
        delete process.env.CMS_URL;
        delete process.env.API_BASE_URL;

        const req = createReq({
            'x-routed-host': 'staging.buildmyonlineweb.site',
            'x-web-proxy-secret': 'shared-secret',
        });
        const next = vi.fn();

        await resolvePublicWebContext(req, {} as any, next);

        expect(mocks.lookupHost).not.toHaveBeenCalled();
        expect(req.headers['x-tenant-id']).toBeUndefined();
        expect(req.headers['x-instance-id']).toBeUndefined();
        expect(next).toHaveBeenCalledWith();
    });
});
