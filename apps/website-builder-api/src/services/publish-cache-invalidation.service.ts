import { logger } from '@project-aurora/core';
import { normalizeDomainHost } from '../utils/domain';
import { normalizePurgeHosts, CloudflareService } from './cloudflare.service';

export interface CacheInvalidationContext {
    action: 'publish' | 'rollback' | 'manual' | 'blog';
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

export interface BuildInvalidationFilesOptions {
    hosts: string[];
    paths?: string[];
}

export interface CacheInvalidationResult {
    hosts: string[];
    attempted: number;
    purged: number;
    failed: string[];
    files: string[];
    filesAttempted: number;
    filesPurged: number;
    filesFailed: string[];
}

export interface CacheInvalidationOptions {
    failOpen?: boolean;
}

function sanitizeSubdomain(subdomain: string): string {
    return subdomain.trim().toLowerCase();
}

function normalizePath(path: string): string {
    const trimmed = path.trim();
    if (!trimmed) {
        return '';
    }

    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function buildOriginFromHost(host: string): string {
    const normalized = normalizeDomainHost(host);
    if (!normalized) {
        return '';
    }

    const isLocal = normalized === 'localhost'
        || normalized === '127.0.0.1'
        || normalized.endsWith('.localhost');

    return `${isLocal ? 'http' : 'https'}://${normalized}`;
}

const DEFAULT_INVALIDATION_FILE_PATHS = [
    '/sitemap.xml',
    '/sitemap-pages.xml',
    '/sitemap-blog.xml',
    '/sitemap-posts.xml',
    '/sitemap-misc.xml',
    '/blog-sitemap.xml',
    '/blog-locations.kml',
    '/llms.txt',
    '/llms-full.txt',
    '/robots.txt',
];

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

export function buildInvalidationFiles(options: BuildInvalidationFilesOptions): string[] {
    const hosts = normalizePurgeHosts(options.hosts);
    const paths = Array.from(
        new Set((options.paths || DEFAULT_INVALIDATION_FILE_PATHS)
            .map((path) => normalizePath(path))
            .filter((path) => path.length > 0))
    );

    if (hosts.length === 0 || paths.length === 0) {
        return [];
    }

    const files: string[] = [];
    for (const host of hosts) {
        const origin = buildOriginFromHost(host);
        if (!origin) {
            continue;
        }

        for (const path of paths) {
            files.push(`${origin}${path}`);
        }
    }

    return files;
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
            files: [],
            filesAttempted: 0,
            filesPurged: 0,
            filesFailed: [],
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
            files: [],
            filesAttempted: 0,
            filesPurged: 0,
            filesFailed: [],
        };
    }

    const files = buildInvalidationFiles({ hosts });

    try {
        const hostResult = await cloudflare.purgeHosts(hosts);
        const fileResult = await cloudflare.purgeFiles(files);

        if (hostResult.failed.length > 0 || fileResult.failed.length > 0) {
            logger.warn('Cache invalidation partially failed', {
                action: context.action,
                subdomain: context.subdomain,
                version: context.version,
                attemptedHosts: hostResult.attempted,
                purgedHosts: hostResult.purged,
                failedHosts: hostResult.failed,
                attemptedFiles: fileResult.attempted,
                purgedFiles: fileResult.purged,
                failedFiles: fileResult.failed,
            });

            if (!failOpen) {
                throw new Error('Cloudflare purge failed for one or more hosts/files');
            }
        }

        return {
            hosts,
            attempted: hostResult.attempted,
            purged: hostResult.purged,
            failed: hostResult.failed,
            files,
            filesAttempted: fileResult.attempted,
            filesPurged: fileResult.purged,
            filesFailed: fileResult.failed,
        };
    } catch (error) {
        logger.warn('Cache invalidation failed', {
            action: context.action,
            subdomain: context.subdomain,
            version: context.version,
            attemptedHosts: hosts.length,
            failedHosts: hosts,
            attemptedFiles: files.length,
            failedFiles: files,
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
            files,
            filesAttempted: files.length,
            filesPurged: 0,
            filesFailed: files,
        };
    }
}
