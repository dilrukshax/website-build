const DEFAULT_ROUTING_INDEX_CACHE_TTL_MS = 30_000;
const DEFAULT_FALLBACK_PUBLISHED_BROWSER_MAX_AGE_SECONDS = 60;
const DEFAULT_FALLBACK_PUBLISHED_SHARED_MAX_AGE_SECONDS = 300;
const DEFAULT_FALLBACK_PUBLISHED_STALE_WHILE_REVALIDATE_SECONDS = 600;

function parsePositiveInteger(input: string | undefined, fallback: number): number {
    const value = Number(input);
    if (!Number.isFinite(value) || value <= 0) {
        return fallback;
    }

    return Math.floor(value);
}

const ROUTING_INDEX_CACHE_TTL_MS = parsePositiveInteger(
    process.env.NEXT_PUBLIC_ROUTING_INDEX_CACHE_TTL_MS || process.env.ROUTING_INDEX_CACHE_TTL_MS,
    DEFAULT_ROUTING_INDEX_CACHE_TTL_MS,
);

const ROUTING_POINTER_BROWSER_MAX_AGE_SECONDS = Math.max(1, Math.floor(ROUTING_INDEX_CACHE_TTL_MS / 1000));
const ROUTING_POINTER_SHARED_MAX_AGE_SECONDS = Math.max(
    ROUTING_POINTER_BROWSER_MAX_AGE_SECONDS,
    ROUTING_POINTER_BROWSER_MAX_AGE_SECONDS * 2,
);
const ROUTING_POINTER_STALE_WHILE_REVALIDATE_SECONDS = Math.max(
    300,
    ROUTING_POINTER_SHARED_MAX_AGE_SECONDS * 10,
);

export const ROUTING_POINTER_CACHE_CONTROL = [
    'public',
    `max-age=${ROUTING_POINTER_BROWSER_MAX_AGE_SECONDS}`,
    `s-maxage=${ROUTING_POINTER_SHARED_MAX_AGE_SECONDS}`,
    `stale-while-revalidate=${ROUTING_POINTER_STALE_WHILE_REVALIDATE_SECONDS}`,
].join(', ');

export const PUBLISHED_FALLBACK_CACHE_CONTROL = [
    'public',
    `max-age=${DEFAULT_FALLBACK_PUBLISHED_BROWSER_MAX_AGE_SECONDS}`,
    `s-maxage=${DEFAULT_FALLBACK_PUBLISHED_SHARED_MAX_AGE_SECONDS}`,
    `stale-while-revalidate=${DEFAULT_FALLBACK_PUBLISHED_STALE_WHILE_REVALIDATE_SECONDS}`,
].join(', ');

export function isPointerJsonPath(pathSegments: string[]): boolean {
    const lastSegment = pathSegments[pathSegments.length - 1];
    return typeof lastSegment === 'string' && lastSegment.toLowerCase() === 'current.json';
}
