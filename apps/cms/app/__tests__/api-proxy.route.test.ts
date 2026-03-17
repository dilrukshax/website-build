import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../api/[...path]/route';

describe('CMS /api proxy route', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('forwards requests to API and preserves query + auth headers', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                    'x-upstream': 'ok',
                },
            }),
        );

        const request = new NextRequest('https://buildmyonlineweb.site/api/cms/instances?foo=bar', {
            method: 'GET',
            headers: {
                authorization: 'Bearer token-123',
                'x-tenant-id': 'tenant-1',
                cookie: 'accessToken=token-123',
            },
        });

        const response = await GET(request, { params: { path: ['cms', 'instances'] } });
        const payload = await response.json();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.example.com/cms/instances?foo=bar');

        const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
        const headers = new Headers(init.headers);
        expect(headers.get('authorization')).toBe('Bearer token-123');
        expect(headers.get('x-tenant-id')).toBe('tenant-1');
        expect(headers.get('cookie')).toContain('accessToken=token-123');

        expect(response.status).toBe(200);
        expect(response.headers.get('x-upstream')).toBe('ok');
        expect(payload).toEqual({ success: true });
    });

    it('forwards non-GET bodies and response status unchanged', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response('created', {
                status: 201,
                headers: {
                    'content-type': 'text/plain',
                },
            }),
        );

        const request = new NextRequest('https://buildmyonlineweb.site/api/cms/instances/abc/custom-domain', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({ customDomain: 'example.com' }),
        });

        const response = await POST(request, { params: { path: ['cms', 'instances', 'abc', 'custom-domain'] } });
        const responseBody = await response.text();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
        const body = init.body as ArrayBuffer;
        expect(Buffer.from(body).toString('utf8')).toBe('{"customDomain":"example.com"}');

        expect(response.status).toBe(201);
        expect(responseBody).toBe('created');
    });
});
