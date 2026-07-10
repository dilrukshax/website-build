import express from 'express';
import cors from 'cors';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDynamicCorsOptionsDelegate } from '../../middleware/cors';

const lookupKnownActiveHost = vi.fn();

function createApp(staticOriginsRaw: string = 'https://buildmyonlineweb.site') {
    const app = express();
    const delegate = createDynamicCorsOptionsDelegate({
        staticOriginsRaw,
        isKnownActiveHost: lookupKnownActiveHost,
        hostCacheTtlMs: 60_000,
    });

    app.use(cors(delegate));
    app.get('/web/sites/:subdomain', (_req, res) => {
        res.json({ success: true });
    });
    app.get('/cms/instances', (_req, res) => {
        res.json({ success: true });
    });

    return app;
}

describe('dynamic CORS delegate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('allows /web origins mapped to active custom/full domains', async () => {
        lookupKnownActiveHost.mockResolvedValue(true);
        const app = createApp();

        const customDomainResponse = await request(app)
            .get('/web/sites/mysalon')
            .set('Origin', 'https://www.clientsite.com');

        expect(customDomainResponse.status).toBe(200);
        expect(customDomainResponse.headers['access-control-allow-origin']).toBe('https://www.clientsite.com');
        expect(lookupKnownActiveHost).toHaveBeenCalledWith('www.clientsite.com');

        const fullDomainResponse = await request(app)
            .get('/web/sites/mysalon')
            .set('Origin', 'https://mysalon.buildmyonlineweb.site');

        expect(fullDomainResponse.status).toBe(200);
        expect(fullDomainResponse.headers['access-control-allow-origin']).toBe('https://mysalon.buildmyonlineweb.site');
        expect(lookupKnownActiveHost).toHaveBeenCalledWith('mysalon.buildmyonlineweb.site');
    });

    it('rejects unknown origins for /web paths', async () => {
        lookupKnownActiveHost.mockResolvedValue(false);
        const app = createApp();

        const response = await request(app)
            .get('/web/sites/mysalon')
            .set('Origin', 'https://unknown-client.com');

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
        expect(lookupKnownActiveHost).toHaveBeenCalledWith('unknown-client.com');
    });

    it('keeps static CMS origin from CORS_ORIGIN allowed', async () => {
        const app = createApp('https://cms.buildmyonlineweb.site');

        const response = await request(app)
            .get('/cms/instances')
            .set('Origin', 'https://cms.buildmyonlineweb.site');

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe('https://cms.buildmyonlineweb.site');
        expect(lookupKnownActiveHost).not.toHaveBeenCalled();
    });

    it('reflects request origin when CORS_ORIGIN is wildcard', async () => {
        const app = createApp('*');

        const response = await request(app)
            .get('/cms/instances')
            .set('Origin', 'https://buildmyonlineweb.site');

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe('https://buildmyonlineweb.site');
        expect(lookupKnownActiveHost).not.toHaveBeenCalled();
    });
});
