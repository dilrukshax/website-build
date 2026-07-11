import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../web/[...path]/route';

describe('CMS /web proxy route', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
        process.env.WEB_PROXY_SHARED_SECRET = 'shared-secret';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('forwards to API /web path and enforces trusted routed host headers', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                    'x-upstream': 'ok',
                },
            }),
        );

        const request = new NextRequest('https://www.clientsite.com/web/services?foo=bar', {
            method: 'GET',
            headers: {
                host: 'www.clientsite.com',
                'x-routed-host': 'attacker.com',
                'x-web-proxy-secret': 'attacker-secret',
            },
        });

        const response = await GET(request, { params: { path: ['services'] } });
        const payload = await response.json();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.example.com/web/services?foo=bar');

        const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
        const headers = new Headers(init.headers);
        expect(headers.get('x-routed-host')).toBe('www.clientsite.com');
        expect(headers.get('x-web-proxy-secret')).toBe('shared-secret');

        expect(response.status).toBe(200);
        expect(response.headers.get('x-upstream')).toBe('ok');
        expect(payload).toEqual({ success: true });
    });

    it('forwards non-GET body and status codes unchanged', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response('created', {
                status: 201,
                headers: {
                    'content-type': 'text/plain',
                },
            }),
        );

        const request = new NextRequest('https://www.clientsite.com/web/bookings', {
            method: 'POST',
            headers: {
                host: 'www.clientsite.com',
                'content-type': 'application/json',
            },
            body: JSON.stringify({ serviceId: 'svc-1' }),
        });

        const response = await POST(request, { params: { path: ['bookings'] } });
        const responseBody = await response.text();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
        const body = init.body as ArrayBuffer;
        expect(Buffer.from(body).toString('utf8')).toBe('{"serviceId":"svc-1"}');

        expect(response.status).toBe(201);
        expect(responseBody).toBe('created');
    });
});

