import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api-client';

const originalFetch = globalThis.fetch;

function jsonResponse(payload: unknown, status: number): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function createUnsignedJwt(secondsFromNow: number): string {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) + secondsFromNow }),
    ).toString('base64url');
    return `${header}.${payload}.`;
}

describe('api client refresh handling', () => {
    beforeEach(() => {
        api.clearTokens();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('deduplicates refresh requests when multiple calls receive 401 at once', async () => {
        api.setAccessToken('old-token');
        let refreshRequests = 0;

        globalThis.fetch = vi.fn(async (input, init) => {
            const url = String(input);
            if (url.endsWith('/auth/refresh')) {
                refreshRequests += 1;
                return jsonResponse({
                    success: true,
                    data: { accessToken: 'new-token' },
                }, 200);
            }

            const headers = (init?.headers || {}) as Record<string, string>;
            const authorization = headers['Authorization'] || headers['authorization'] || '';

            if (authorization === 'Bearer old-token') {
                return jsonResponse({
                    success: false,
                    error: { code: 'UNAUTHENTICATED', message: 'expired' },
                }, 401);
            }

            if (authorization === 'Bearer new-token') {
                return jsonResponse({
                    success: true,
                    data: { ok: true },
                }, 200);
            }

            return jsonResponse({
                success: false,
                error: { code: 'UNEXPECTED_AUTH', message: 'Unexpected authorization header' },
            }, 500);
        }) as typeof fetch;

        const [first, second] = await Promise.all([
            api.get<{ ok: boolean }>('/cms/instances'),
            api.get<{ ok: boolean }>('/cms/services'),
        ]);

        expect(first.success).toBe(true);
        expect(second.success).toBe(true);
        expect(refreshRequests).toBe(1);
    });

    it('skips refresh when token is still valid beyond the buffer', async () => {
        api.setAccessToken(createUnsignedJwt(10 * 60));
        const fetchSpy = vi.fn();
        globalThis.fetch = fetchSpy as typeof fetch;

        const ok = await api.refreshSessionIfExpiringSoon(2 * 60 * 1000);

        expect(ok).toBe(true);
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('refreshes when token expiry is near', async () => {
        api.setAccessToken(createUnsignedJwt(30));

        globalThis.fetch = vi.fn(async () => jsonResponse({
            success: true,
            data: { accessToken: 'renewed-token' },
        }, 200)) as typeof fetch;

        const ok = await api.refreshSessionIfExpiringSoon(2 * 60 * 1000);

        expect(ok).toBe(true);
        expect(api.getAccessToken()).toBe('renewed-token');
    });
});
