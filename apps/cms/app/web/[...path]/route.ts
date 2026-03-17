import { NextRequest } from 'next/server';
import { proxyWebRequest } from '../../../lib/web-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolvePathSegments(context: { params?: { path?: string[] } }): string[] {
    return Array.isArray(context.params?.path) ? context.params.path : [];
}

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
    return proxyWebRequest(request, resolvePathSegments(context));
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
    return proxyWebRequest(request, resolvePathSegments(context));
}

export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
    return proxyWebRequest(request, resolvePathSegments(context));
}

export async function PATCH(request: NextRequest, context: { params: { path: string[] } }) {
    return proxyWebRequest(request, resolvePathSegments(context));
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
    return proxyWebRequest(request, resolvePathSegments(context));
}

export async function OPTIONS(request: NextRequest, context: { params: { path: string[] } }) {
    return proxyWebRequest(request, resolvePathSegments(context));
}
