import { env } from './env';

export interface RoutingIndexPointer {
    version: string;
    generatedAt: string;
    indexKey: string;
    indexUrl: string | null;
}

type CachedRoutingIndexPointer = {
    expiresAt: number;
    pointer: RoutingIndexPointer;
};

function parsePositiveInteger(input: string | undefined, fallback: number): number {
    const value = Number(input);
    if (!Number.isFinite(value) || value <= 0) {
        return fallback;
    }

    return Math.floor(value);
}

const ROUTING_INDEX_CACHE_TTL_MS = env.routingIndexCacheTtlMs();
const SHOULD_CACHE_POINTER = process.env.NODE_ENV !== 'test';

let cachedPointer: CachedRoutingIndexPointer | null = null;

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
        env.publishedSitesBaseUrl()
        || process.env.R2_PUBLIC_URL
        || '',
    );
}

function resolveCurrentIndexUrl(): string {
    const explicit = env.routingIndexCurrentUrl();
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
    const now = Date.now();
    if (SHOULD_CACHE_POINTER && cachedPointer && cachedPointer.expiresAt > now) {
        return cachedPointer.pointer;
    }

    const currentUrl = resolveCurrentIndexUrl();
    if (!currentUrl) {
        return null;
    }

    try {
        const response = await fetch(currentUrl, {
            method: 'GET',
        });
        if (!response.ok) {
            return null;
        }

        const pointer = await response.json() as RoutingIndexPointer;
        const resolvedVersionUrl = resolveVersionIndexUrl(pointer);
        const hydratedPointer = {
            ...pointer,
            indexUrl: pointer.indexUrl || resolvedVersionUrl || null,
        };

        if (SHOULD_CACHE_POINTER) {
            cachedPointer = {
                expiresAt: now + ROUTING_INDEX_CACHE_TTL_MS,
                pointer: hydratedPointer,
            };
        }

        return hydratedPointer;
    } catch {
        return null;
    }
}
