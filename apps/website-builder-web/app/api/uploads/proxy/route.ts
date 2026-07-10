import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UploadProxyError {
    code: string;
    message: string;
}

interface ResolvedR2Origins {
    strictOrigins: Set<string>;
    accountId: string | null;
}

function toErrorResponse(status: number, error: UploadProxyError): NextResponse {
    return NextResponse.json({ success: false, error }, { status });
}

function normalizeEndpoint(rawValue?: string): string | null {
    if (!rawValue || !rawValue.trim()) {
        return null;
    }

    const candidate = /^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;

    try {
        return new URL(candidate).origin;
    } catch {
        return null;
    }
}

function resolveAllowedUploadOrigins(): ResolvedR2Origins {
    const strictOrigins = new Set<string>();

    const endpointOrigin = normalizeEndpoint(process.env.R2_ENDPOINT);
    if (endpointOrigin) {
        strictOrigins.add(endpointOrigin);
    }

    const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
    if (accountId) {
        strictOrigins.add(`https://${accountId}.r2.cloudflarestorage.com`);
    }

    return {
        strictOrigins,
        accountId: accountId || null,
    };
}

function isAllowedUploadOrigin(originUrl: URL, resolvedOrigins: ResolvedR2Origins): boolean {
    const host = originUrl.hostname.toLowerCase();

    // Cloudflare R2 signed upload URLs can be either:
    // - <account>.r2.cloudflarestorage.com
    // - <bucket>.<account>.r2.cloudflarestorage.com
    // Allow these by default to avoid requiring duplicate CMS env config.
    if (host.endsWith('.r2.cloudflarestorage.com')) {
        return true;
    }

    if (resolvedOrigins.strictOrigins.has(originUrl.origin)) {
        return true;
    }

    if (!resolvedOrigins.accountId) {
        return false;
    }

    const accountHostSuffix = `.${resolvedOrigins.accountId.toLowerCase()}.r2.cloudflarestorage.com`;

    if (host.endsWith(accountHostSuffix)) {
        return true;
    }

    return false;
}

function normalizeUploadHeaders(input: unknown): Headers {
    const headers = new Headers();

    if (!input || typeof input !== 'object') {
        return headers;
    }

    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
        if (typeof value !== 'string') {
            continue;
        }

        const headerName = key.trim();
        if (!headerName) {
            continue;
        }

        headers.set(headerName, value);
    }

    return headers;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const formData = await request.formData();

        const uploadUrlRaw = formData.get('uploadUrl');
        const uploadHeadersRaw = formData.get('headers');
        const file = formData.get('file');

        if (typeof uploadUrlRaw !== 'string' || !uploadUrlRaw.trim()) {
            return toErrorResponse(400, {
                code: 'UPLOAD_URL_REQUIRED',
                message: 'uploadUrl is required.',
            });
        }

        if (!(file instanceof File)) {
            return toErrorResponse(400, {
                code: 'FILE_REQUIRED',
                message: 'file is required.',
            });
        }

        let uploadUrl: URL;
        try {
            uploadUrl = new URL(uploadUrlRaw);
        } catch {
            return toErrorResponse(400, {
                code: 'INVALID_UPLOAD_URL',
                message: 'uploadUrl must be a valid URL.',
            });
        }

        const allowedOrigins = resolveAllowedUploadOrigins();

        if (!isAllowedUploadOrigin(uploadUrl, allowedOrigins)) {
            return toErrorResponse(400, {
                code: 'UPLOAD_ORIGIN_NOT_ALLOWED',
                message: 'uploadUrl origin is not allowed for proxy upload.',
            });
        }

        let uploadHeadersPayload: unknown = {};
        if (typeof uploadHeadersRaw === 'string' && uploadHeadersRaw.trim()) {
            try {
                uploadHeadersPayload = JSON.parse(uploadHeadersRaw);
            } catch {
                return toErrorResponse(400, {
                    code: 'INVALID_HEADERS_PAYLOAD',
                    message: 'headers must be valid JSON.',
                });
            }
        }

        const uploadHeaders = normalizeUploadHeaders(uploadHeadersPayload);
        if (!uploadHeaders.has('Content-Type') && file.type) {
            uploadHeaders.set('Content-Type', file.type);
        }

        const upstreamResponse = await fetch(uploadUrl.toString(), {
            method: 'PUT',
            headers: uploadHeaders,
            body: file,
            cache: 'no-store',
        });

        if (!upstreamResponse.ok) {
            return toErrorResponse(upstreamResponse.status, {
                code: 'UPLOAD_FAILED',
                message: `Upload failed with status ${upstreamResponse.status}.`,
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                etag: upstreamResponse.headers.get('etag') || null,
            },
        });
    } catch (error) {
        return toErrorResponse(500, {
            code: 'UPLOAD_PROXY_FAILED',
            message: error instanceof Error ? error.message : 'Upload proxy failed.',
        });
    }
}
