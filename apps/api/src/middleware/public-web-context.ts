import { Request, Response, NextFunction } from 'express';
import { logger } from '@booking-engine/core';
import { RoutingIndexService } from '../services/routing-index.service';
import { normalizeDomainHost } from '../utils/domain';

const ROUTED_HOST_HEADER = 'x-routed-host';
const PROXY_SECRET_HEADER = 'x-web-proxy-secret';

function getHeaderValue(req: Request, key: string): string {
    const raw = req.headers[key];
    if (Array.isArray(raw)) {
        return raw[0] || '';
    }
    return typeof raw === 'string' ? raw : '';
}

function hasTrustedProxySecret(req: Request): boolean {
    const expectedSecret = (process.env.WEB_PROXY_SHARED_SECRET || '').trim();
    if (!expectedSecret) {
        return false;
    }

    const providedSecret = getHeaderValue(req, PROXY_SECRET_HEADER).trim();
    if (!providedSecret) {
        return false;
    }

    return providedSecret === expectedSecret;
}

/**
 * Resolve tenant + instance context for public /web traffic from a trusted routed host header.
 *
 * Hybrid behavior:
 * - When trusted proxy headers are present and host resolves in routing index, this middleware
 *   injects X-Tenant-ID and X-Instance-ID for downstream legacy middlewares.
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

        if (!hasTrustedProxySecret(req)) {
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

