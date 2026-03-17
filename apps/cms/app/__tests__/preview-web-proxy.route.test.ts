import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../preview/[subdomain]/web/[...path]/route';

describe('CMS /preview/[subdomain]/web proxy compatibility route', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        process.env.WEB_PROXY_SHARED_SECRET = 'shared-secret';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('proxies rewritten preview web paths to API /web endpoints', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                },
            }),
        );

        const request = new NextRequest('https://sssee.buildmyonlineweb.site/preview/sssee/web/services?foo=bar', {
            method: 'GET',
            headers: {
                host: 'sssee.buildmyonlineweb.site',
            },
        });

        const response = await GET(request, { params: { subdomain: 'sssee', path: ['services'] } });
        const payload = await response.json();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.example.com/web/services?foo=bar');

        const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
        const headers = new Headers(init.headers);
        expect(headers.get('x-routed-host')).toBe('sssee.buildmyonlineweb.site');
        expect(headers.get('x-web-proxy-secret')).toBe('shared-secret');
        expect(payload).toEqual({ success: true });
    });
});
