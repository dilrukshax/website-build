import type { Request } from 'express';
import type { CorsOptions, CorsOptionsDelegate } from 'cors';
import { logger } from '@booking-engine/core';
import { normalizeDomainHost } from '../utils/domain';

const CORS_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const CORS_ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Instance-ID'];
const DEFAULT_HOST_CACHE_TTL_MS = 60_000;

interface WildcardOriginRule {
    protocol: string;
    hostSuffix: string;
    port: string;
}

interface ParsedStaticOrigins {
    allowAny: boolean;
    exact: Set<string>;
    wildcards: WildcardOriginRule[];
}

export interface DynamicCorsDelegateOptions {
    staticOriginsRaw?: string;
    hostCacheTtlMs?: number;
    isKnownActiveHost: (host: string) => Promise<boolean>;
}

type CacheEntry = {
    allowed: boolean;
    expiresAt: number;
};

function normalizeOrigin(origin: string): string {
    try {
        const parsed = new URL(origin);
        return `${parsed.protocol}//${parsed.host}`.toLowerCase();
    } catch {
        return '';
    }
}

function parseStaticOrigins(staticOriginsRaw?: string): ParsedStaticOrigins {
    let allowAny = false;
    const exact = new Set<string>();
    const wildcards: WildcardOriginRule[] = [];

    const values = (staticOriginsRaw || '')
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    for (const value of values) {
        if (value === '*') {
            allowAny = true;
            continue;
        }

        const wildcardMatch = value.match(/^(https?):\/\/\*\.([a-z0-9.-]+)(?::(\d+))?$/i);
        if (wildcardMatch) {
            wildcards.push({
                protocol: `${wildcardMatch[1]!.toLowerCase()}:`,
                hostSuffix: wildcardMatch[2]!.toLowerCase(),
                port: wildcardMatch[3] || '',
            });
            continue;
        }

        const normalized = normalizeOrigin(value);
        if (normalized) {
            exact.add(normalized);
        }
    }

    return { allowAny, exact, wildcards };
}

function matchesWildcardRule(origin: URL, rule: WildcardOriginRule): boolean {
    if (origin.protocol.toLowerCase() !== rule.protocol) {
        return false;
    }

    const hostname = origin.hostname.toLowerCase();
    if (!hostname.endsWith(`.${rule.hostSuffix}`)) {
        return false;
    }

    if (!rule.port) {
        return true;
    }

    return origin.port === rule.port;
}

function isStaticOriginAllowed(origin: string, parsedStaticOrigins: ParsedStaticOrigins): boolean {
    if (parsedStaticOrigins.allowAny) {
        return true;
    }

    const normalized = normalizeOrigin(origin);
    if (!normalized) {
        return false;
    }

    if (parsedStaticOrigins.exact.has(normalized)) {
        return true;
    }

    try {
        const parsed = new URL(normalized);
        return parsedStaticOrigins.wildcards.some((rule) => matchesWildcardRule(parsed, rule));
    } catch {
        return false;
    }
}

function isWebRequestPath(req: Request): boolean {
    return req.path === '/web' || req.path.startsWith('/web/');
}

function getHostFromOrigin(origin: string): string {
    try {
        return normalizeDomainHost(new URL(origin).hostname);
    } catch {
        return '';
    }
}

function getBaseCorsOptions(): CorsOptions {
    return {
        methods: CORS_METHODS,
        allowedHeaders: CORS_ALLOWED_HEADERS,
        credentials: true,
    };
}

export function createDynamicCorsOptionsDelegate(options: DynamicCorsDelegateOptions): CorsOptionsDelegate<Request> {
    const baseOptions = getBaseCorsOptions();
    const parsedStaticOrigins = parseStaticOrigins(options.staticOriginsRaw);
    const hostCacheTtlMs = options.hostCacheTtlMs ?? DEFAULT_HOST_CACHE_TTL_MS;
    const hostAllowanceCache = new Map<string, CacheEntry>();

    return (req, callback) => {
        const origin = req.header('Origin');

        // Non-browser requests (curl/server-to-server) are allowed.
        if (!origin) {
            callback(null, { ...baseOptions, origin: true });
            return;
        }

        if (isStaticOriginAllowed(origin, parsedStaticOrigins)) {
            callback(null, { ...baseOptions, origin });
            return;
        }

        // Dynamic DB-backed checks are only for public web endpoints.
        if (!isWebRequestPath(req)) {
            callback(null, { ...baseOptions, origin: false });
            return;
        }

        const host = getHostFromOrigin(origin);
        if (!host) {
            callback(null, { ...baseOptions, origin: false });
            return;
        }

        const cached = hostAllowanceCache.get(host);
        const now = Date.now();
        if (cached && cached.expiresAt > now) {
            callback(null, { ...baseOptions, origin: cached.allowed ? origin : false });
            return;
        }

        void options.isKnownActiveHost(host)
            .then((allowed) => {
                hostAllowanceCache.set(host, { allowed, expiresAt: now + hostCacheTtlMs });
                callback(null, { ...baseOptions, origin: allowed ? origin : false });
            })
            .catch((error) => {
                logger.error('Dynamic CORS host check failed', { host, error });
                callback(null, { ...baseOptions, origin: false });
            });
    };
}

export const corsInternals = {
    normalizeOrigin,
    parseStaticOrigins,
    isStaticOriginAllowed,
};
