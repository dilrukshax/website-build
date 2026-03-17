import { beforeEach, describe, expect, it, vi } from 'vitest';

function createRequest(url, host, accessToken) {
    const nextUrl = new URL(url);
    nextUrl.clone = () => new URL(url);

    return {
        nextUrl,
        url,
        headers: {
            get: (key) => (key.toLowerCase() === 'host' ? (host || new URL(url).host) : null),
        },
        cookies: {
            get: (key) => (key === 'accessToken' && accessToken ? { value: accessToken } : undefined),
        },
    };
}

function mockRoutingIndex(hosts) {
    const fetchMock = vi.fn()
        .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                version: 'v-1',
                generatedAt: new Date().toISOString(),
                indexKey: 'routing-index/v-1.json',
                indexUrl: 'https://cdn.example.com/routing-index/v-1.json',
            }),
        })
        .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                version: 'v-1',
                generatedAt: new Date().toISOString(),
                hosts,
            }),
        });

    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

async function loadMiddleware() {
    const mod = await import('../../../../cms/middleware.ts');
    return mod.middleware;
}

describe('CMS middleware host routing via CDN index', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        vi.unstubAllEnvs();
        vi.stubEnv('NEXT_PUBLIC_SITE_DOMAIN', 'buildmyonlineweb.site');
        vi.stubEnv('NEXT_PUBLIC_PUBLISHED_SITES_BASE_URL', 'https://cdn.example.com');
    });

    it('rewrites primary-domain subdomain hosts from routing index', async () => {
        mockRoutingIndex({
            'mysalon.buildmyonlineweb.site': {
                instanceId: 'inst-1',
                tenantId: 'tenant-1',
                subdomain: 'mysalon',
                manifestUrl: 'https://cdn.example.com/sites/inst-1/current.json',
                active: true,
            },
        });

        const middleware = await loadMiddleware();
        const request = createRequest('https://mysalon.buildmyonlineweb.site/about');
        const response = await middleware(request);

        const rewriteTarget = response.headers.get('x-middleware-rewrite');
        expect(rewriteTarget).toContain('/preview/mysalon/about');
    });

    it('rewrites known custom hosts to resolved preview subdomain', async () => {
        mockRoutingIndex({
            'www.clientsite.com': {
                instanceId: 'inst-1',
                tenantId: 'tenant-1',
                subdomain: 'mysalon',
                manifestUrl: 'https://cdn.example.com/sites/inst-1/current.json',
                active: true,
            },
        });

        const middleware = await loadMiddleware();
        const request = createRequest('https://www.clientsite.com/services');
        const response = await middleware(request);

        const rewriteTarget = response.headers.get('x-middleware-rewrite');
        expect(rewriteTarget).toContain('/preview/mysalon/services');
    });

    it('rewrites unresolved custom hosts to __unknown__', async () => {
        mockRoutingIndex({});

        const middleware = await loadMiddleware();
        const request = createRequest('https://unknown-client.com/services');
        const response = await middleware(request);

        const rewriteTarget = response.headers.get('x-middleware-rewrite');
        expect(rewriteTarget).toContain('/preview/__unknown__/services');
    });

    it('does not rewrite /web proxy paths on published hosts', async () => {
        mockRoutingIndex({
            'www.clientsite.com': {
                instanceId: 'inst-1',
                tenantId: 'tenant-1',
                subdomain: 'mysalon',
                manifestUrl: 'https://cdn.example.com/sites/inst-1/current.json',
                active: true,
            },
        });

        const middleware = await loadMiddleware();
        const request = createRequest('https://www.clientsite.com/web/services');
        const response = await middleware(request);

        const rewriteTarget = response.headers.get('x-middleware-rewrite');
        expect(rewriteTarget).toBeNull();
    });

    it('does not rewrite /preview paths on published hosts (prevents rewrite loops)', async () => {
        mockRoutingIndex({
            'www.clientsite.com': {
                instanceId: 'inst-1',
                tenantId: 'tenant-1',
                subdomain: 'mysalon',
                manifestUrl: 'https://cdn.example.com/sites/inst-1/current.json',
                active: true,
            },
        });

        const middleware = await loadMiddleware();
        const request = createRequest('https://www.clientsite.com/preview/mysalon/web/services');
        const response = await middleware(request);

        const rewriteTarget = response.headers.get('x-middleware-rewrite');
        expect(rewriteTarget).toBeNull();
    });

    it('does not rewrite /routing-index paths on published hosts', async () => {
        mockRoutingIndex({
            'www.clientsite.com': {
                instanceId: 'inst-1',
                tenantId: 'tenant-1',
                subdomain: 'mysalon',
                manifestUrl: 'https://cdn.example.com/sites/inst-1/current.json',
                active: true,
            },
        });

        const middleware = await loadMiddleware();
        const request = createRequest('https://www.clientsite.com/routing-index/current.json');
        const response = await middleware(request);

        const rewriteTarget = response.headers.get('x-middleware-rewrite');
        expect(rewriteTarget).toBeNull();
    });

    it('does not rewrite /published proxy paths on published hosts', async () => {
        mockRoutingIndex({
            'www.clientsite.com': {
                instanceId: 'inst-1',
                tenantId: 'tenant-1',
                subdomain: 'mysalon',
                manifestUrl: 'https://cdn.example.com/sites/inst-1/current.json',
                active: true,
            },
        });

        const middleware = await loadMiddleware();
        const request = createRequest('https://www.clientsite.com/published/routing-index/v-1.json');
        const response = await middleware(request);

        const rewriteTarget = response.headers.get('x-middleware-rewrite');
        expect(rewriteTarget).toBeNull();
    });

    it('does not rewrite /web proxy paths on platform subdomains', async () => {
        mockRoutingIndex({
            'mysalon.buildmyonlineweb.site': {
                instanceId: 'inst-1',
                tenantId: 'tenant-1',
                subdomain: 'mysalon',
                manifestUrl: 'https://cdn.example.com/sites/inst-1/current.json',
                active: true,
            },
        });

        const middleware = await loadMiddleware();
        const request = createRequest('https://mysalon.buildmyonlineweb.site/web/services');
        const response = await middleware(request);

        const rewriteTarget = response.headers.get('x-middleware-rewrite');
        expect(rewriteTarget).toBeNull();
    });
});
