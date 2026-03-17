import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getPublished } from '../published/[...path]/route';
import { GET as getPreviewPublished } from '../preview/[subdomain]/published/[...path]/route';

describe('CMS published artifact proxy routes', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_PUBLISHED_SITES_BASE_URL = 'https://cdn.example.com';
        process.env.PUBLISHED_SITES_BASE_URL = '';
        process.env.R2_PUBLIC_URL = '';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('proxies root /published route path to configured base URL', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                },
            }),
        );

        const request = new NextRequest('https://site.test/published/routing-index/v-1.json?foo=bar', {
            method: 'GET',
        });

        const response = await getPublished(request, { params: { path: ['routing-index', 'v-1.json'] } });
        const payload = await response.json();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toBe('https://cdn.example.com/routing-index/v-1.json?foo=bar');
        expect(response.status).toBe(200);
        expect(payload).toEqual({ ok: true });
    });

    it('proxies preview compatibility /published route path', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response('manifest', {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                },
            }),
        );

        const request = new NextRequest('https://client.test/preview/ssss/published/sites/i/current.json', {
            method: 'GET',
        });

        const response = await getPreviewPublished(request, { params: { subdomain: 'ssss', path: ['sites', 'i', 'current.json'] } });
        const body = await response.text();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toBe('https://cdn.example.com/sites/i/current.json');
        expect(response.status).toBe(200);
        expect(body).toBe('manifest');
    });
});
