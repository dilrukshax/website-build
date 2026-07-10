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
    'x-routed-host',
    'x-web-proxy-secret',
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
    'content-encoding',
]);

function normalizeHost(host: string | null | undefined): string {
    if (!host) {
        return '';
    }

    const trimmed = host.trim().toLowerCase();
    if (!trimmed) {
        return '';
    }

    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    try {
        return new URL(candidate).hostname.toLowerCase();
    } catch {
        return '';
    }
}

function readIncomingHost(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-host');
    if (forwarded) {
        const firstForwarded = forwarded.split(',')[0]?.trim() || '';
        const normalized = normalizeHost(firstForwarded);
        if (normalized) {
            return normalized;
        }
    }

    return normalizeHost(request.headers.get('host'));
}

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

function buildUpstreamUrl(request: NextRequest, pathSegments: string[]): string {
    const apiBaseUrl = normalizeApiBaseUrl(
        process.env.NEXT_PUBLIC_WEBSITE_BUILDER_API_URL
        || process.env.WEBSITE_BUILDER_API_URL
        || process.env.NEXT_PUBLIC_API_URL
        || process.env.API_BASE_URL
        || '',
    );

    if (!apiBaseUrl) {
        return '';
    }

    const encodedPath = pathSegments
        .map((segment) => encodeURIComponent(segment))
        .join('/');
    const pathname = encodedPath ? `/web/${encodedPath}` : '/web';
    const target = new URL(pathname, apiBaseUrl);
    target.search = request.nextUrl.search;
    return target.toString();
}

function buildUpstreamHeaders(request: NextRequest): Headers {
    const headers = new Headers();

    request.headers.forEach((value, key) => {
        const normalizedKey = key.toLowerCase();
        if (REQUEST_HOP_BY_HOP_HEADERS.has(normalizedKey)) {
            return;
        }

        headers.set(key, value);
    });

    const routedHost = readIncomingHost(request);
    if (routedHost) {
        headers.set('X-Routed-Host', routedHost);
    }

    const proxySecret = (process.env.WEB_PROXY_SHARED_SECRET || '').trim();
    if (proxySecret) {
        headers.set('X-Web-Proxy-Secret', proxySecret);
    }

    return headers;
}

function buildResponseHeaders(upstreamHeaders: Headers): Headers {
    const headers = new Headers(upstreamHeaders);
    for (const key of RESPONSE_HOP_BY_HOP_HEADERS) {
        headers.delete(key);
    }
    return headers;
}

export async function proxyWebRequest(request: NextRequest, pathSegments: string[]): Promise<NextResponse> {
    const upstreamUrl = buildUpstreamUrl(request, pathSegments);
    if (!upstreamUrl) {
        return NextResponse.json({
            success: false,
            error: {
                code: 'UPSTREAM_NOT_CONFIGURED',
                message: 'NEXT_PUBLIC_API_URL (or API_BASE_URL) is required for web proxy routing.',
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
                code: 'UPSTREAM_REQUEST_FAILED',
                message: error instanceof Error ? error.message : 'Web proxy request failed',
            },
        }, { status: 502 });
    }
}
