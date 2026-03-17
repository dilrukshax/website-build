export interface RoutingIndexPointer {
    version: string;
    generatedAt: string;
    indexKey: string;
    indexUrl: string | null;
}

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

function resolveCurrentIndexUrl(): string {
    const explicit = (process.env.NEXT_PUBLIC_ROUTING_INDEX_CURRENT_URL || process.env.ROUTING_INDEX_CURRENT_URL || '').trim();
    if (explicit) {
        return explicit;
    }

    const base = resolvePublishedBaseUrl();
    return base ? `${base}/routing-index/current.json` : '';
}

function resolveVersionIndexUrl(pointer: RoutingIndexPointer): string {
    if (pointer.indexUrl) {
        return pointer.indexUrl;
    }

    const base = resolvePublishedBaseUrl();
    if (!base || !pointer.indexKey) {
        return '';
    }

    return `${base}/${pointer.indexKey.replace(/^\/+/, '')}`;
}

export async function fetchCurrentRoutingIndexPointer(): Promise<RoutingIndexPointer | null> {
    const currentUrl = resolveCurrentIndexUrl();
    if (!currentUrl) {
        return null;
    }

    try {
        const response = await fetch(currentUrl, {
            method: 'GET',
            cache: 'no-store',
        });
        if (!response.ok) {
            return null;
        }

        const pointer = await response.json() as RoutingIndexPointer;
        const resolvedVersionUrl = resolveVersionIndexUrl(pointer);
        return {
            ...pointer,
            indexUrl: pointer.indexUrl || resolvedVersionUrl || null,
        };
    } catch {
        return null;
    }
}
