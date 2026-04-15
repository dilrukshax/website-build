import { Request, Response, NextFunction } from 'express';
import { logger } from '@booking-engine/core';
import { RoutingIndexService } from '../services/routing-index.service';
import { normalizeDomainHost } from '../utils/domain';

const ROUTED_HOST_HEADER = 'x-routed-host';
const PROXY_SECRET_HEADER = 'x-web-proxy-secret';
const RESERVED_PLATFORM_SUBDOMAINS = ['staging', 'staging-api'];
let hasLoggedMissingProxySecretWarning = false;

function getHeaderValue(req: Request, key: string): string {
    const raw = req.headers[key];
    if (Array.isArray(raw)) {
        return raw[0] || '';
    }
    return typeof raw === 'string' ? raw : '';
}

function hasLegacyContextHeaders(req: Request): boolean {
    const tenantId = getHeaderValue(req, 'x-tenant-id').trim();
    const instanceId = getHeaderValue(req, 'x-instance-id').trim();
    return Boolean(tenantId || instanceId);
}

function parseHostList(input: string | null | undefined): string[] {
    if (!input) {
        return [];
    }

    return input
        .split(',')
        .map((value) => normalizeDomainHost(value))
        .filter(Boolean);
}

function addHostWithVariants(hosts: Set<string>, host: string): void {
    if (!host) {
        return;
    }

    hosts.add(host);

    if (host.startsWith('www.')) {
        const apex = host.slice(4);
        if (apex) {
            hosts.add(apex);
        }
        return;
    }

    hosts.add(`www.${host}`);
}

function addReservedPlatformSubdomainHosts(hosts: Set<string>, rootDomain: string): void {
    if (!rootDomain) {
        return;
    }

    for (const subdomain of RESERVED_PLATFORM_SUBDOMAINS) {
        addHostWithVariants(hosts, `${subdomain}.${rootDomain}`);
    }
}

function resolvePlatformBypassHosts(): Set<string> {
    const hosts = new Set<string>();
    const rootDomain =
        normalizeDomainHost(process.env.SITE_DOMAIN || '')
        || normalizeDomainHost(process.env.NEXT_PUBLIC_SITE_DOMAIN || '');
    const configuredHosts = [
        normalizeDomainHost(process.env.CMS_URL || ''),
        normalizeDomainHost(process.env.NEXT_PUBLIC_CMS_URL || ''),
        normalizeDomainHost(process.env.API_BASE_URL || ''),
        normalizeDomainHost(process.env.NEXT_PUBLIC_API_URL || ''),
        ...parseHostList(process.env.PLATFORM_HOST_BYPASS || ''),
        ...parseHostList(process.env.NEXT_PUBLIC_PLATFORM_HOST_BYPASS || ''),
    ];

    for (const host of configuredHosts) {
        addHostWithVariants(hosts, host);
    }

    addReservedPlatformSubdomainHosts(hosts, rootDomain);

    return hosts;
}

function isPlatformBypassHost(hostname: string): boolean {
    if (!hostname) {
        return false;
    }

    return resolvePlatformBypassHosts().has(hostname);
}

function canResolveFromRoutedHost(req: Request): boolean {
    const expectedSecret = (process.env.WEB_PROXY_SHARED_SECRET || '').trim();
    const providedSecret = getHeaderValue(req, PROXY_SECRET_HEADER).trim();

    // Compatibility fallback: when no shared secret is configured, allow host-based
    // resolution only for requests that do not already carry legacy tenant/instance headers.
    if (!expectedSecret) {
        if (!hasLoggedMissingProxySecretWarning) {
            logger.warn('WEB_PROXY_SHARED_SECRET is not configured; /web routed-host resolution is running in compatibility mode.');
            hasLoggedMissingProxySecretWarning = true;
        }

        return !hasLegacyContextHeaders(req);
    }

    return providedSecret === expectedSecret;
}

/**
 * Resolve tenant + instance context for public /web traffic from a trusted routed host header.
 *
 * Hybrid behavior:
 * - When trusted proxy headers are present and host resolves in routing index, this middleware
 *   injects X-Tenant-ID and X-Instance-ID for downstream legacy middlewares.
 * - If WEB_PROXY_SHARED_SECRET is not configured, it falls back to compatibility mode
 *   for requests without legacy headers.
 * - Otherwise it does nothing so existing header-based fallback remains available.
 */
export async function resolvePublicWebContext(
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const routedHost = normalizeDomainHost(getHeaderValue(req, ROUTED_HOST_HEADER));
        if (!routedHost) {
            next();
            return;
        }

        if (isPlatformBypassHost(routedHost)) {
            next();
            return;
        }

        if (!canResolveFromRoutedHost(req)) {
            next();
            return;
        }

        const entry = await RoutingIndexService.lookupHost(routedHost);
        if (!entry?.active) {
            next();
            return;
        }

        // Override any incoming fallback headers to enforce trusted host-resolved context.
        req.headers['x-tenant-id'] = entry.tenantId;
        req.headers['x-instance-id'] = entry.instanceId;

        next();
    } catch (error) {
        logger.error('Public web context middleware error', { error });
        next(error);
    }
}
