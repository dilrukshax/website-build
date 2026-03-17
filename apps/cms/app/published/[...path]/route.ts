import { NextRequest } from 'next/server';
import { proxyPublishedRequest } from '../../../lib/published-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolvePathSegments(context: { params?: { path?: string[] } }): string[] {
    return Array.isArray(context.params?.path) ? context.params.path : [];
}

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
    return proxyPublishedRequest(request, resolvePathSegments(context));
}

export async function HEAD(request: NextRequest, context: { params: { path: string[] } }) {
    return proxyPublishedRequest(request, resolvePathSegments(context));
}
