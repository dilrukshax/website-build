import { logger } from '@booking-engine/core';
import { normalizeDomainHost } from '../utils/domain';
import { normalizePurgeHosts, CloudflareService } from './cloudflare.service';

export interface CacheInvalidationContext {
    action: 'publish' | 'rollback' | 'manual';
    subdomain: string;
    fullDomain?: string | null;
    customDomain?: string | null;
    manifest?: unknown;
    version: number;
}

export interface BuildInvalidationHostsOptions {
    subdomain: string;
    fullDomain?: string | null;
    customDomain?: string | null;
    siteDomain?: string;
}

export interface CacheInvalidationResult {
    hosts: string[];
    attempted: number;
    purged: number;
    failed: string[];
}

export interface CacheInvalidationOptions {
    failOpen?: boolean;
}

function sanitizeSubdomain(subdomain: string): string {
    return subdomain.trim().toLowerCase();
}

export function buildInvalidationHosts(options: BuildInvalidationHostsOptions): string[] {
    const siteDomain = normalizeDomainHost(options.siteDomain || '');
    const subdomain = sanitizeSubdomain(options.subdomain);
    const fullDomain = normalizeDomainHost(options.fullDomain || '');
    const customDomain = normalizeDomainHost(options.customDomain || '');

    const hosts: string[] = [];
    if (fullDomain) {
        hosts.push(fullDomain);
    } else if (siteDomain && subdomain) {
        hosts.push(`${subdomain}.${siteDomain}`);
    }
    if (customDomain) {
        hosts.push(customDomain);
    }

    return normalizePurgeHosts(hosts);
}

export async function invalidatePublishedSiteCache(
    context: CacheInvalidationContext,
    options: CacheInvalidationOptions = {}
): Promise<CacheInvalidationResult> {
    const failOpen = options.failOpen !== false;
    const siteDomain = process.env.SITE_DOMAIN || process.env.NEXT_PUBLIC_SITE_DOMAIN || '';

    const hosts = buildInvalidationHosts({
        subdomain: context.subdomain,
        fullDomain: context.fullDomain,
        customDomain: context.customDomain,
        siteDomain,
    });

    if (hosts.length === 0) {
        const error = new Error('No cache purge hosts resolved');
        logger.warn('Cache invalidation skipped: no host targets resolved', {
            action: context.action,
            subdomain: context.subdomain,
            version: context.version,
            siteDomainConfigured: Boolean(siteDomain),
        });

        if (!failOpen) {
            throw error;
        }

        return {
            hosts: [],
            attempted: 0,
            purged: 0,
            failed: [],
        };
    }

    const cloudflare = new CloudflareService();
    if (!cloudflare.isConfigured()) {
        const error = new Error('Cloudflare service not configured');
        logger.warn('Cache invalidation skipped: Cloudflare credentials not configured', {
            action: context.action,
            subdomain: context.subdomain,
            version: context.version,
            attemptedHosts: hosts.length,
        });

        if (!failOpen) {
            throw error;
        }

        return {
            hosts,
            attempted: hosts.length,
            purged: 0,
            failed: hosts,
        };
    }

    try {
        const result = await cloudflare.purgeHosts(hosts);

        if (result.failed.length > 0) {
            logger.warn('Cache invalidation partially failed', {
                action: context.action,
                subdomain: context.subdomain,
                version: context.version,
                attemptedHosts: result.attempted,
                purgedHosts: result.purged,
                failedHosts: result.failed,
            });

            if (!failOpen) {
                throw new Error('Cloudflare host purge failed for one or more hosts');
            }
        }

        return {
            hosts,
            attempted: result.attempted,
            purged: result.purged,
            failed: result.failed,
        };
    } catch (error) {
        logger.warn('Cache invalidation failed', {
            action: context.action,
            subdomain: context.subdomain,
            version: context.version,
            attemptedHosts: hosts.length,
            failedHosts: hosts,
            error: error instanceof Error ? error.message : String(error),
        });

        if (!failOpen) {
            throw error;
        }

        return {
            hosts,
            attempted: hosts.length,
            purged: 0,
            failed: hosts,
        };
    }
}
