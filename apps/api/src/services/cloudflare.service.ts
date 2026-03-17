import axios from 'axios';
import { normalizeDomainHost } from '../utils/domain';

export interface CloudflareCredentials {
    apiToken: string;
    zoneId: string;
}

export interface CloudflarePurgeFilesResult {
    attempted: number;
    purged: number;
    failed: string[];
}

export interface CloudflarePurgeHostsResult {
    attempted: number;
    purged: number;
    failed: string[];
}

export const CLOUDFLARE_PURGE_FILES_BATCH_SIZE = 30;
export const CLOUDFLARE_PURGE_HOSTS_BATCH_SIZE = 30;
export const CLOUDFLARE_PURGE_BATCH_SIZE = CLOUDFLARE_PURGE_FILES_BATCH_SIZE;
const CLOUDFLARE_API_TIMEOUT_MS = Number(process.env.CLOUDFLARE_API_TIMEOUT_MS || 15000);

export function normalizePurgeFiles(files: string[]): string[] {
    return Array.from(
        new Set(
            files
                .map((file) => file.trim())
                .filter((file) => file.length > 0)
        )
    );
}

export function normalizePurgeHosts(hosts: string[]): string[] {
    return Array.from(
        new Set(
            hosts
                .map((host) => normalizeDomainHost(host))
                .filter((host) => host.length > 0)
        )
    );
}

export function chunkPurgeFiles(files: string[], batchSize: number = CLOUDFLARE_PURGE_FILES_BATCH_SIZE): string[][] {
    if (batchSize <= 0) {
        throw new Error('batchSize must be greater than 0');
    }

    const chunks: string[][] = [];
    for (let i = 0; i < files.length; i += batchSize) {
        chunks.push(files.slice(i, i + batchSize));
    }

    return chunks;
}

export function chunkPurgeHosts(hosts: string[], batchSize: number = CLOUDFLARE_PURGE_HOSTS_BATCH_SIZE): string[][] {
    if (batchSize <= 0) {
        throw new Error('batchSize must be greater than 0');
    }

    const chunks: string[][] = [];
    for (let i = 0; i < hosts.length; i += batchSize) {
        chunks.push(hosts.slice(i, i + batchSize));
    }

    return chunks;
}

function resolveCredentials(input?: Partial<CloudflareCredentials>): CloudflareCredentials {
    return {
        apiToken: input?.apiToken || process.env.CLOUDFLARE_API_TOKEN || '',
        zoneId: input?.zoneId || process.env.CLOUDFLARE_ZONE_ID || '',
    };
}

export class CloudflareService {
    private apiToken: string;
    private zoneId: string;
    private baseUrl = 'https://api.cloudflare.com/client/v4';

    constructor(config?: Partial<CloudflareCredentials>) {
        const resolved = resolveCredentials(config);
        this.apiToken = resolved.apiToken;
        this.zoneId = resolved.zoneId;
    }

    isConfigured(): boolean {
        return Boolean(this.apiToken && this.zoneId);
    }

    private get headers() {
        return {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
        };
    }

    private ensureConfigured(): void {
        if (!this.isConfigured()) {
            throw new Error('Cloudflare service not configured');
        }
    }

    private get requestConfig() {
        return {
            headers: this.headers,
            timeout: CLOUDFLARE_API_TIMEOUT_MS,
        };
    }

    /**
     * Purge a list of exact URLs from Cloudflare cache.
     * Uses batched `files` payloads to stay under API limits.
     */
    async purgeFiles(files: string[]): Promise<CloudflarePurgeFilesResult> {
        this.ensureConfigured();

        const uniqueFiles = normalizePurgeFiles(files);
        if (uniqueFiles.length === 0) {
            return { attempted: 0, purged: 0, failed: [] };
        }

        let purged = 0;
        const failed: string[] = [];
        const batches = chunkPurgeFiles(uniqueFiles);

        for (const batch of batches) {
            try {
                const response = await axios.post(
                    `${this.baseUrl}/zones/${this.zoneId}/purge_cache`,
                    { files: batch },
                    this.requestConfig
                );

                if (!response.data?.success) {
                    failed.push(...batch);
                    continue;
                }

                purged += batch.length;
            } catch (error: any) {
                console.error('Cloudflare API Error (purgeFiles):', error.response?.data || error.message);
                failed.push(...batch);
            }
        }

        return {
            attempted: uniqueFiles.length,
            purged,
            failed,
        };
    }

    /**
     * Purge all cache entries for a list of hostnames.
     * Uses batched `hosts` payloads to stay under API limits.
     */
    async purgeHosts(hosts: string[]): Promise<CloudflarePurgeHostsResult> {
        this.ensureConfigured();

        const uniqueHosts = normalizePurgeHosts(hosts);
        if (uniqueHosts.length === 0) {
            return { attempted: 0, purged: 0, failed: [] };
        }

        let purged = 0;
        const failed: string[] = [];
        const batches = chunkPurgeHosts(uniqueHosts);

        for (const batch of batches) {
            try {
                const response = await axios.post(
                    `${this.baseUrl}/zones/${this.zoneId}/purge_cache`,
                    { hosts: batch },
                    this.requestConfig
                );

                if (!response.data?.success) {
                    failed.push(...batch);
                    continue;
                }

                purged += batch.length;
            } catch (error: any) {
                console.error('Cloudflare API Error (purgeHosts):', error.response?.data || error.message);
                failed.push(...batch);
            }
        }

        return {
            attempted: uniqueHosts.length,
            purged,
            failed,
        };
    }
}
