import { DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { logger } from '@project-aurora/core';

const NO_CACHE_HEADER_VALUE = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0';
const IMMUTABLE_CACHE_HEADER_VALUE = 'public, max-age=31536000, immutable';

export interface UploadPublishedWebsiteInput {
    instanceId: string;
    subdomain: string;
    version: number;
    manifest: unknown;
    prunePreviousVersions?: boolean;
}

export interface UploadPublishedWebsiteResult {
    manifestKey: string;
    manifestUrl: string | null;
    currentKey: string;
    currentUrl: string | null;
}

export interface DeleteInstanceArtifactsInput {
    tenantId: string;
    instanceId: string;
    mediaObjectKeys?: string[];
}

export interface DeleteInstanceArtifactsResult {
    deletedPublishedObjectCount: number;
    deletedMediaObjectCount: number;
    deletedTotalCount: number;
}

type UploadJsonOptions = {
    cacheControl?: string;
    contentType?: string;
};

type UploadWebsiteLegacyInput = {
    subdomain: string;
    manifest: unknown;
};

export class S3Service {
    private client: S3Client | null = null;
    private bucketName: string | null = null;
    private publicBaseUrl: string | null = null;

    constructor() {
        const accountId = process.env.R2_ACCOUNT_ID;
        const endpointFromEnv = process.env.R2_ENDPOINT;
        const accessKeyId = process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
        this.bucketName = process.env.R2_BUCKET_NAME || null;
        this.publicBaseUrl = normalizePublicBaseUrl(process.env.PUBLISHED_SITES_BASE_URL || process.env.R2_PUBLIC_URL || '');

        const endpoint = endpointFromEnv
            ? normalizeEndpoint(endpointFromEnv)
            : accountId
                ? `https://${accountId}.r2.cloudflarestorage.com`
                : null;

        if (endpoint && accessKeyId && secretAccessKey) {
            this.client = new S3Client({
                region: 'auto',
                endpoint,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });
        }
    }

    isConfigured(): boolean {
        return Boolean(this.client && this.bucketName);
    }

    buildPublicUrl(key: string): string | null {
        if (!this.publicBaseUrl) {
            return null;
        }
        return `${this.publicBaseUrl}/${key.replace(/^\/+/, '')}`;
    }

    async uploadJsonObject(key: string, payload: unknown, options: UploadJsonOptions = {}): Promise<void> {
        this.ensureConfigured();

        await this.client!.send(new PutObjectCommand({
            Bucket: this.bucketName!,
            Key: key,
            Body: JSON.stringify(payload),
            ContentType: options.contentType || 'application/json',
            CacheControl: options.cacheControl || NO_CACHE_HEADER_VALUE,
        }));
    }

    async getJsonObject<T>(key: string): Promise<T | null> {
        this.ensureConfigured();

        try {
            const response = await this.client!.send(new GetObjectCommand({
                Bucket: this.bucketName!,
                Key: key,
            }));
            const body = await streamBodyToString(response.Body);
            if (!body) {
                return null;
            }
            return JSON.parse(body) as T;
        } catch (error: any) {
            if (error?.name === 'NoSuchKey') {
                return null;
            }
            throw error;
        }
    }

    async uploadPublishedWebsite(input: UploadPublishedWebsiteInput): Promise<UploadPublishedWebsiteResult> {
        this.ensureConfigured();

        const instanceId = input.instanceId.trim();
        const subdomain = input.subdomain.trim().toLowerCase();
        if (!instanceId || !subdomain || !Number.isFinite(input.version) || input.version <= 0) {
            throw new Error('Invalid publish upload payload');
        }

        const manifestKey = `sites/${instanceId}/v${input.version}/manifest.json`;
        const currentKey = `sites/${instanceId}/current.json`;

        await this.uploadJsonObject(
            manifestKey,
            input.manifest,
            { cacheControl: IMMUTABLE_CACHE_HEADER_VALUE }
        );

        await this.uploadJsonObject(currentKey, {
            instanceId,
            subdomain,
            version: input.version,
            manifestKey,
            manifestUrl: this.buildPublicUrl(manifestKey),
            updatedAt: new Date().toISOString(),
        });

        const shouldPrunePreviousVersions = typeof input.prunePreviousVersions === 'boolean'
            ? input.prunePreviousVersions
            : resolveShouldPrunePublishedVersions();

        if (shouldPrunePreviousVersions) {
            try {
                await this.pruneVersionedManifestArtifacts(instanceId, input.version);
            } catch (error) {
                logger.warn('Failed to prune previous published manifest artifacts', {
                    instanceId,
                    keepVersion: input.version,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }

        return {
            manifestKey,
            manifestUrl: this.buildPublicUrl(manifestKey),
            currentKey,
            currentUrl: this.buildPublicUrl(currentKey),
        };
    }

    async deleteInstanceArtifacts(input: DeleteInstanceArtifactsInput): Promise<DeleteInstanceArtifactsResult> {
        this.ensureConfigured();

        const tenantId = input.tenantId.trim();
        const instanceId = input.instanceId.trim();
        if (!tenantId || !instanceId) {
            throw new Error('Invalid instance artifact cleanup payload');
        }

        const publishedPrefix = `sites/${instanceId}/`;
        const mediaPrefix = `uploads/${tenantId}/${instanceId}/`;
        const explicitMediaKeys = normalizeObjectKeys(input.mediaObjectKeys || []);
        const explicitMediaKeysOutsidePrefix = explicitMediaKeys.filter((key) => !key.startsWith(mediaPrefix));

        const [deletedPublishedObjectCount, deletedMediaPrefixObjectCount, deletedExplicitMediaObjectCount] = await Promise.all([
            this.deleteObjectsByPrefix(publishedPrefix),
            this.deleteObjectsByPrefix(mediaPrefix),
            this.deleteObjects(explicitMediaKeysOutsidePrefix),
        ]);

        const deletedMediaObjectCount = deletedMediaPrefixObjectCount + deletedExplicitMediaObjectCount;
        return {
            deletedPublishedObjectCount,
            deletedMediaObjectCount,
            deletedTotalCount: deletedPublishedObjectCount + deletedMediaObjectCount,
        };
    }

    /**
     * Backward-compatible wrapper used by existing publish flows.
     * New callers should use uploadPublishedWebsite().
     */
    async uploadWebsite(input: UploadPublishedWebsiteInput | string, manifestMaybe?: unknown): Promise<void> {
        if (typeof input === 'string') {
            const legacy: UploadWebsiteLegacyInput = {
                subdomain: input,
                manifest: manifestMaybe,
            };

            const fallbackInstanceId = sanitizeIdentifier(legacy.subdomain);
            await this.uploadPublishedWebsite({
                instanceId: fallbackInstanceId || legacy.subdomain,
                subdomain: legacy.subdomain,
                version: 1,
                manifest: legacy.manifest,
            });
            return;
        }

        await this.uploadPublishedWebsite(input);
    }

    private ensureConfigured(): void {
        if (!this.client || !this.bucketName) {
            throw new Error('S3/R2 client not configured');
        }
    }

    private async deleteObjectsByPrefix(prefix: string): Promise<number> {
        const keys = await this.listObjectKeysByPrefix(prefix);
        return this.deleteObjects(keys);
    }

    private async listObjectKeysByPrefix(prefix: string): Promise<string[]> {
        const normalizedPrefix = prefix.trim();
        if (!normalizedPrefix) {
            return [];
        }

        const bucketName = this.bucketName!;
        const keys: string[] = [];
        let continuationToken: string | undefined;

        do {
            const response = await this.client!.send(new ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: normalizedPrefix,
                ContinuationToken: continuationToken,
            }));

            const contents = response.Contents || [];
            for (const object of contents) {
                const key = object.Key || '';
                if (key) {
                    keys.push(key);
                }
            }

            continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
        } while (continuationToken);

        return keys;
    }

    private async deleteObjects(keys: string[]): Promise<number> {
        const normalizedKeys = normalizeObjectKeys(keys);
        if (normalizedKeys.length === 0) {
            return 0;
        }

        const bucketName = this.bucketName!;
        for (const chunk of chunkArray(normalizedKeys, 1000)) {
            await this.client!.send(new DeleteObjectsCommand({
                Bucket: bucketName,
                Delete: {
                    Objects: chunk.map((key) => ({ Key: key })),
                    Quiet: true,
                },
            }));
        }

        return normalizedKeys.length;
    }

    private async pruneVersionedManifestArtifacts(instanceId: string, keepVersion: number): Promise<void> {
        const normalizedInstanceId = instanceId.trim();
        if (!normalizedInstanceId) {
            return;
        }

        const prefix = `sites/${normalizedInstanceId}/`;
        const versionedManifestPattern = new RegExp(`^sites/${escapeRegExp(normalizedInstanceId)}/v(\\d+)/manifest\\.json$`);
        const keys = await this.listObjectKeysByPrefix(prefix);
        const keysToDelete: string[] = [];

        for (const key of keys) {
            const match = key.match(versionedManifestPattern);
            if (!match) {
                continue;
            }

            const version = Number(match[1]);
            if (!Number.isFinite(version) || version === keepVersion) {
                continue;
            }

            keysToDelete.push(key);
        }

        await this.deleteObjects(keysToDelete);
    }
}

function normalizeEndpoint(endpoint: string): string {
    const trimmed = endpoint.trim();
    if (!trimmed) return trimmed;
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return withProtocol.replace(/\/+$/, '');
}

function normalizePublicBaseUrl(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
        const url = new URL(withProtocol);
        return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, '')}`;
    } catch {
        return null;
    }
}

function sanitizeIdentifier(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

function resolveShouldPrunePublishedVersions(): boolean {
    return parseBoolean(process.env.PUBLISHED_SITES_PRUNE_OLD_VERSIONS, true);
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
    const normalized = (value || '').trim().toLowerCase();
    if (!normalized) {
        return fallback;
    }

    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
        return true;
    }

    if (['0', 'false', 'no', 'off'].includes(normalized)) {
        return false;
    }

    return fallback;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function chunkArray<T>(items: T[], size: number): T[][] {
    if (!Array.isArray(items) || items.length === 0) {
        return [];
    }

    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}

function normalizeObjectKeys(keys: string[]): string[] {
    return Array.from(new Set(
        keys
            .map((key) => key.trim())
            .filter((key) => key.length > 0),
    ));
}

async function streamBodyToString(body: unknown): Promise<string> {
    if (!body) {
        return '';
    }

    if (typeof (body as { transformToString?: unknown }).transformToString === 'function') {
        return (body as { transformToString: () => Promise<string> }).transformToString();
    }

    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array | Buffer | string>) {
        if (typeof chunk === 'string') {
            chunks.push(Buffer.from(chunk));
        } else {
            chunks.push(Buffer.from(chunk));
        }
    }
    return Buffer.concat(chunks).toString('utf8');
}
