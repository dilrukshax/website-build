import { NextRequest, NextResponse } from 'next/server';
import { performance } from 'node:perf_hooks';
import { env } from './env';

const REQUEST_HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'host',
    'content-length',
]);

const RESPONSE_HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'content-length',
    'content-encoding', // Node fetch() auto-decompresses; forwarding this causes double-decompression in browser
]);

function normalizeApiBaseUrl(rawBaseUrl: string): string {
    const trimmed = rawBaseUrl.trim();
    if (!trimmed) {
        return '';
    }

    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
        const parsed = new URL(candidate);
        return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}`;
    } catch {
        return '';
    }
}

function resolveApiBaseUrl(): string {
    return normalizeApiBaseUrl(env.apiBaseUrl() || 'http://localhost:3002');
}

function buildUpstreamUrl(request: NextRequest, pathSegments: string[]): string {
    const apiBaseUrl = resolveApiBaseUrl();
    if (!apiBaseUrl) {
        return '';
    }

    const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
    const pathname = encodedPath ? `/${encodedPath}` : '/';
    const target = new URL(pathname, `${apiBaseUrl}/`);
    target.search = request.nextUrl.search;
    return target.toString();
}

function buildUpstreamHeaders(request: NextRequest): Headers {
    const headers = new Headers();

    request.headers.forEach((value, key) => {
        if (REQUEST_HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
            return;
        }

        headers.set(key, value);
    });

    if (!headers.has('authorization')) {
        const cookieToken = request.cookies.get('accessToken')?.value;
        if (cookieToken) {
            headers.set('authorization', `Bearer ${cookieToken}`);
        }
    }

    // Prevent the upstream API from returning gzip, Brotli, or Zstandard
    // to the Next.js server-side proxy.
    headers.set('accept-encoding', 'identity');

    return headers;
}

function buildResponseHeaders(upstreamHeaders: Headers): Headers {
    const headers = new Headers(upstreamHeaders);
    for (const key of RESPONSE_HOP_BY_HOP_HEADERS) {
        headers.delete(key);
    }
    return headers;
}

export async function proxyApiRequest(request: NextRequest, pathSegments: string[]): Promise<NextResponse> {
    const upstreamUrl = buildUpstreamUrl(request, pathSegments);
    if (!upstreamUrl) {
        return NextResponse.json({
            success: false,
            error: {
                code: 'UPSTREAM_NOT_CONFIGURED',
                message: 'WEBSITE_BUILDER_API_URL is required for API proxy routing.',
            },
        }, { status: 500 });
    }

    try {
        const method = request.method.toUpperCase();
        const hasBody = method !== 'GET' && method !== 'HEAD';
        const body = hasBody ? await request.arrayBuffer() : undefined;

        const startedAt = performance.now();

        const upstreamResponse = await fetch(upstreamUrl, {
            method,
            headers: buildUpstreamHeaders(request),
            body: hasBody && body && body.byteLength > 0 ? body : undefined,
            cache: 'no-store',
        });

        const upstreamDuration = performance.now() - startedAt;

        // Reading the body here ensures Node finishes decoding any
        // accidentally compressed upstream response before returning it.
        const responseBody = await upstreamResponse.arrayBuffer();

        const responseHeaders = buildResponseHeaders(upstreamResponse.headers);
        responseHeaders.append(
            'Server-Timing',
            `upstream;dur=${upstreamDuration.toFixed(1)}`,
        );

        return new NextResponse(Buffer.from(responseBody), {
            status: upstreamResponse.status,
            headers: responseHeaders,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: {
                code: 'UPSTREAM_REQUEST_FAILED',
                message: error instanceof Error ? error.message : 'API proxy request failed',
            },
        }, { status: 502 });
    }
}
