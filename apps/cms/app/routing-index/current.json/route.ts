import { NextResponse } from 'next/server';
import { ROUTING_POINTER_CACHE_CONTROL } from '../../../lib/cache-policy';
import { fetchCurrentRoutingIndexPointer } from '../../../lib/routing-index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    const pointer = await fetchCurrentRoutingIndexPointer();
    if (!pointer) {
        return NextResponse.json({
            success: false,
            error: {
                code: 'ROUTING_INDEX_UNAVAILABLE',
                message: 'Routing index pointer is unavailable.',
            },
        }, {
            status: 404,
            headers: {
                'cache-control': ROUTING_POINTER_CACHE_CONTROL,
            },
        });
    }

    const indexKey = pointer.indexKey.replace(/^\/+/, '');
    const sameOriginIndexUrl = indexKey ? `/published/${indexKey}` : pointer.indexUrl;

    return NextResponse.json({
        ...pointer,
        indexUrl: sameOriginIndexUrl,
    }, {
        status: 200,
        headers: {
            'cache-control': ROUTING_POINTER_CACHE_CONTROL,
        },
    });
}
