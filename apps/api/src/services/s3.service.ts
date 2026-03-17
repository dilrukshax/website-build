import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const NO_CACHE_HEADER_VALUE = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0';
const IMMUTABLE_CACHE_HEADER_VALUE = 'public, max-age=31536000, immutable';

export interface UploadPublishedWebsiteInput {
    instanceId: string;
    subdomain: string;
    version: number;
    manifest: unknown;
}

export interface UploadPublishedWebsiteResult {
    manifestKey: string;
    manifestUrl: string | null;
    currentKey: string;
    currentUrl: string | null;
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

        return {
            manifestKey,
            manifestUrl: this.buildPublicUrl(manifestKey),
            currentKey,
            currentUrl: this.buildPublicUrl(currentKey),
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
