import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as getRootRoutingIndex } from '../routing-index/current.json/route';
import { GET as getPreviewRoutingIndex } from '../preview/[subdomain]/routing-index/current.json/route';

describe('CMS routing-index proxy routes', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_ROUTING_INDEX_CURRENT_URL = '';
        process.env.ROUTING_INDEX_CURRENT_URL = '';
        process.env.NEXT_PUBLIC_PUBLISHED_SITES_BASE_URL = 'https://cdn.example.com';
        process.env.PUBLISHED_SITES_BASE_URL = '';
        process.env.R2_PUBLIC_URL = '';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('proxies current pointer and normalizes indexUrl for root route', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({
                version: 'v-1',
                generatedAt: '2026-03-16T00:00:00.000Z',
                indexKey: 'routing-index/v-1.json',
                indexUrl: null,
            }), { status: 200 }),
        );

        const response = await getRootRoutingIndex();
        const payload = await response.json() as {
            version: string;
            indexKey: string;
            indexUrl: string | null;
        };

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toBe('https://cdn.example.com/routing-index/current.json');
        expect(response.status).toBe(200);
        expect(payload.version).toBe('v-1');
        expect(payload.indexKey).toBe('routing-index/v-1.json');
        expect(payload.indexUrl).toBe('/published/routing-index/v-1.json');
    });

    it('proxies current pointer for preview compatibility route', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({
                version: 'v-2',
                generatedAt: '2026-03-16T00:00:00.000Z',
                indexKey: 'routing-index/v-2.json',
                indexUrl: 'https://cdn.example.com/routing-index/v-2.json',
            }), { status: 200 }),
        );

        const response = await getPreviewRoutingIndex();
        const payload = await response.json() as {
            version: string;
            indexUrl: string | null;
        };

        expect(response.status).toBe(200);
        expect(payload.version).toBe('v-2');
        expect(payload.indexUrl).toBe('/published/routing-index/v-2.json');
    });

    it('returns 404 when routing index pointer cannot be resolved', async () => {
        process.env.NEXT_PUBLIC_PUBLISHED_SITES_BASE_URL = '';
        process.env.PUBLISHED_SITES_BASE_URL = '';
        process.env.R2_PUBLIC_URL = '';

        const fetchMock = vi.spyOn(globalThis, 'fetch');

        const response = await getRootRoutingIndex();
        const payload = await response.json() as {
            success: boolean;
            error?: { code?: string };
        };

        expect(fetchMock).not.toHaveBeenCalled();
        expect(response.status).toBe(404);
        expect(payload.success).toBe(false);
        expect(payload.error?.code).toBe('ROUTING_INDEX_UNAVAILABLE');
    });
});
