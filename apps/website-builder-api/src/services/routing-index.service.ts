import { logger } from '@project-aurora/core';
import { db, runWithoutTenantContext } from '@project-aurora/database';
import { normalizeDomainHost } from '../utils/domain';
import { CloudflareService } from './cloudflare.service';
import { S3Service } from './s3.service';

const ROUTING_INDEX_CURRENT_KEY = 'routing-index/current.json';
const ROUTING_INDEX_CACHE_TTL_MS = Number(process.env.ROUTING_INDEX_CACHE_TTL_MS || 30_000);

export interface RoutingIndexEntry {
    instanceId: string;
    tenantId: string;
    subdomain: string;
    manifestUrl: string | null;
    active: boolean;
    source: 'fullDomain' | 'domainRoute' | 'legacyCustomDomain';
}

export interface RoutingIndexDocument {
    version: string;
    generatedAt: string;
    hosts: Record<string, RoutingIndexEntry>;
}

export interface RoutingIndexPointer {
    version: string;
    generatedAt: string;
    indexKey: string;
    indexUrl: string | null;
    hostCount: number;
}

export interface RoutingIndexRebuildOptions {
    changedHosts?: string[];
    purgeCache?: boolean;
}

export interface RoutingIndexRebuildResult {
    pointer: RoutingIndexPointer;
    index: RoutingIndexDocument;
    changedHosts: string[];
}

type CachedRoutingIndex = {
    expiresAt: number;
    index: RoutingIndexDocument;
};

let cachedRoutingIndex: CachedRoutingIndex | null = null;

function normalizeHosts(hosts: string[]): string[] {
    return Array.from(new Set(hosts.map((host) => normalizeDomainHost(host)).filter(Boolean)));
}

function nowVersionStamp(now: Date): string {
    const iso = now.toISOString().replace(/[-:.TZ]/g, '');
    return `v-${iso}`;
}

function resolvePublishedBaseUrl(): string {
    return (
        process.env.PUBLISHED_SITES_BASE_URL
        || process.env.R2_PUBLIC_URL
        || ''
    ).trim().replace(/\/+$/, '');
}

function resolveRoutingIndexCurrentUrl(): string {
    const explicit = (process.env.ROUTING_INDEX_CURRENT_URL || '').trim();
    if (explicit) {
        return explicit;
    }

    const base = resolvePublishedBaseUrl();
    return base ? `${base}/${ROUTING_INDEX_CURRENT_KEY}` : '';
}

function toAbsoluteIndexUrl(pointer: RoutingIndexPointer): string {
    if (pointer.indexUrl) {
        return pointer.indexUrl;
    }

    const base = resolvePublishedBaseUrl();
    if (!base || !pointer.indexKey) {
        return '';
    }

    return `${base}/${pointer.indexKey.replace(/^\/+/, '')}`;
}

function buildEntry(input: {
    instanceId: string;
    tenantId: string;
    subdomain: string;
    source: RoutingIndexEntry['source'];
    publicBaseUrl: string | null;
}): RoutingIndexEntry {
    const manifestPath = `sites/${input.instanceId}/current.json`;
    const manifestUrl = input.publicBaseUrl
        ? `${input.publicBaseUrl}/${manifestPath}`
        : null;

    return {
        instanceId: input.instanceId,
        tenantId: input.tenantId,
        subdomain: input.subdomain,
        manifestUrl,
        active: true,
        source: input.source,
    };
}

function shouldReplaceEntry(current: RoutingIndexEntry, next: RoutingIndexEntry): boolean {
    const order: Record<RoutingIndexEntry['source'], number> = {
        domainRoute: 3,
        legacyCustomDomain: 2,
        fullDomain: 1,
    };

    return order[next.source] > order[current.source];
}

async function purgeRoutingIndexCache(changedHosts: string[]): Promise<void> {
    const cloudflare = new CloudflareService();
    if (!cloudflare.isConfigured()) {
        return;
    }

    const filesToPurge: string[] = [];
    const currentUrl = resolveRoutingIndexCurrentUrl();
    if (currentUrl) {
        filesToPurge.push(currentUrl);
    }

    if (filesToPurge.length > 0) {
        await cloudflare.purgeFiles(filesToPurge);
    }

    const hosts = normalizeHosts(changedHosts);
    if (hosts.length > 0) {
        await cloudflare.purgeHosts(hosts);
    }
}

export class RoutingIndexService {
    static async rebuildAndPublish(options: RoutingIndexRebuildOptions = {}): Promise<RoutingIndexRebuildResult> {
        const now = new Date();
        const version = nowVersionStamp(now);
        const indexKey = `routing-index/${version}.json`;

        const [instances, domainRoutes] = await runWithoutTenantContext(async () => Promise.all([
            db.instance.findMany({
                where: { status: 'active' },
                select: {
                    id: true,
                    tenantId: true,
                    subdomain: true,
                    fullDomain: true,
                    customDomain: true,
                },
            }),
            db.domainRoute.findMany({
                where: { active: true },
                select: {
                    host: true,
                    instanceId: true,
                    instance: {
                        select: {
                            tenantId: true,
                            subdomain: true,
                            status: true,
                        },
                    },
                },
            }),
        ]));

        const hosts: Record<string, RoutingIndexEntry> = {};
        const s3 = new S3Service();
        const publicBaseUrl = s3.buildPublicUrl('')?.replace(/\/$/, '') || null;

        for (const instance of instances) {
            const baseEntry = buildEntry({
                instanceId: instance.id,
                tenantId: instance.tenantId,
                subdomain: instance.subdomain,
                source: 'fullDomain',
                publicBaseUrl,
            });

            const fullDomain = normalizeDomainHost(instance.fullDomain || '');
            if (fullDomain) {
                hosts[fullDomain] = baseEntry;
            }

            const legacyCustomDomain = normalizeDomainHost(instance.customDomain || '');
            if (legacyCustomDomain) {
                const nextEntry = {
                    ...baseEntry,
                    source: 'legacyCustomDomain' as const,
                };
                const current = hosts[legacyCustomDomain];
                if (!current || shouldReplaceEntry(current, nextEntry)) {
                    hosts[legacyCustomDomain] = nextEntry;
                }
            }
        }

        for (const route of domainRoutes) {
            const host = normalizeDomainHost(route.host);
            if (!host || !route.instance || route.instance.status !== 'active') {
                continue;
            }

            const nextEntry = buildEntry({
                instanceId: route.instanceId,
                tenantId: route.instance.tenantId,
                subdomain: route.instance.subdomain,
                source: 'domainRoute',
                publicBaseUrl,
            });

            const current = hosts[host];
            if (!current || shouldReplaceEntry(current, nextEntry)) {
                hosts[host] = nextEntry;
            }
        }

        const index: RoutingIndexDocument = {
            version,
            generatedAt: now.toISOString(),
            hosts,
        };

        const pointer: RoutingIndexPointer = {
            version,
            generatedAt: now.toISOString(),
            indexKey,
            indexUrl: s3.buildPublicUrl(indexKey),
            hostCount: Object.keys(hosts).length,
        };

        await s3.uploadJsonObject(indexKey, index, {
            cacheControl: 'public, max-age=31536000, immutable',
        });

        await s3.uploadJsonObject(ROUTING_INDEX_CURRENT_KEY, pointer);

        const changedHosts = normalizeHosts(options.changedHosts || Object.keys(hosts));
        if (options.purgeCache !== false) {
            try {
                await purgeRoutingIndexCache(changedHosts);
            } catch (error) {
                logger.warn('Routing index cache purge failed', {
                    error: error instanceof Error ? error.message : String(error),
                    hostCount: changedHosts.length,
                });
            }
        }

        cachedRoutingIndex = {
            expiresAt: Date.now() + ROUTING_INDEX_CACHE_TTL_MS,
            index,
        };

        return {
            pointer,
            index,
            changedHosts,
        };
    }

    static async lookupHost(host: string): Promise<RoutingIndexEntry | null> {
        const normalizedHost = normalizeDomainHost(host);
        if (!normalizedHost) {
            return null;
        }

        const index = await this.getActiveIndex();
        if (!index) {
            return null;
        }

        const entry = index.hosts[normalizedHost];
        if (entry?.active) {
            return entry;
        }

        if (normalizedHost.startsWith('www.')) {
            const apex = normalizedHost.slice(4);
            const apexEntry = index.hosts[apex];
            if (apexEntry?.active) {
                return apexEntry;
            }
        } else {
            const wwwEntry = index.hosts[`www.${normalizedHost}`];
            if (wwwEntry?.active) {
                return wwwEntry;
            }
        }

        return null;
    }

    static async isKnownActiveHost(host: string): Promise<boolean> {
        const entry = await this.lookupHost(host);
        return Boolean(entry?.active);
    }

    private static async getActiveIndex(): Promise<RoutingIndexDocument | null> {
        const now = Date.now();
        if (cachedRoutingIndex && cachedRoutingIndex.expiresAt > now) {
            return cachedRoutingIndex.index;
        }

        try {
            const pointerUrl = resolveRoutingIndexCurrentUrl();
            if (!pointerUrl) {
                return null;
            }

            const pointerResponse = await fetch(pointerUrl);
            if (!pointerResponse.ok) {
                return null;
            }

            const pointer = await pointerResponse.json() as RoutingIndexPointer;
            const indexUrl = toAbsoluteIndexUrl(pointer);
            if (!indexUrl) {
                return null;
            }

            const indexResponse = await fetch(indexUrl);
            if (!indexResponse.ok) {
                return null;
            }

            const index = await indexResponse.json() as RoutingIndexDocument;
            cachedRoutingIndex = {
                expiresAt: now + ROUTING_INDEX_CACHE_TTL_MS,
                index,
            };

            return index;
        } catch (error) {
            logger.warn('Unable to load routing index from CDN', {
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
}
