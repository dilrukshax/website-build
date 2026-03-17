import { NextRequest, NextResponse } from 'next/server';

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
]);

function normalizeBaseUrl(input: string | null | undefined): string {
    const value = (input || '').trim();
    if (!value) {
        return '';
    }

    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
        const parsed = new URL(withProtocol);
        return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}`;
    } catch {
        return '';
    }
}

function resolvePublishedBaseUrl(): string {
    return normalizeBaseUrl(
        process.env.NEXT_PUBLIC_PUBLISHED_SITES_BASE_URL
        || process.env.PUBLISHED_SITES_BASE_URL
        || process.env.R2_PUBLIC_URL
        || '',
    );
}

function buildUpstreamUrl(request: NextRequest, pathSegments: string[]): string {
    const publishedBaseUrl = resolvePublishedBaseUrl();
    if (!publishedBaseUrl) {
        return '';
    }

    const encodedPath = pathSegments
        .map((segment) => encodeURIComponent(segment))
        .join('/');
    const pathname = encodedPath ? `/${encodedPath}` : '/';
    const target = new URL(pathname, publishedBaseUrl);
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

    return headers;
}

function buildResponseHeaders(upstreamHeaders: Headers): Headers {
    const headers = new Headers(upstreamHeaders);
    for (const key of RESPONSE_HOP_BY_HOP_HEADERS) {
        headers.delete(key);
    }
    return headers;
}

export async function proxyPublishedRequest(request: NextRequest, pathSegments: string[]): Promise<NextResponse> {
    const upstreamUrl = buildUpstreamUrl(request, pathSegments);
    if (!upstreamUrl) {
        return NextResponse.json({
            success: false,
            error: {
                code: 'PUBLISHED_BASE_URL_NOT_CONFIGURED',
                message: 'Published sites base URL is not configured.',
            },
        }, { status: 500 });
    }

    try {
        const method = request.method.toUpperCase();
        const hasBody = method !== 'GET' && method !== 'HEAD';
        const body = hasBody ? await request.arrayBuffer() : undefined;

        const upstreamResponse = await fetch(upstreamUrl, {
            method,
            headers: buildUpstreamHeaders(request),
            body: hasBody && body && body.byteLength > 0 ? body : undefined,
            cache: 'no-store',
        });

        return new NextResponse(upstreamResponse.body, {
            status: upstreamResponse.status,
            statusText: upstreamResponse.statusText,
            headers: buildResponseHeaders(upstreamResponse.headers),
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: {
                code: 'PUBLISHED_PROXY_FAILED',
                message: error instanceof Error ? error.message : 'Published proxy request failed',
            },
        }, { status: 502 });
    }
}
