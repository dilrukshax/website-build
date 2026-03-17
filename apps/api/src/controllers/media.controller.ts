import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

/**
 * Media upload controller.
 *
 * Generates Cloudflare R2 presigned upload URLs and stores media metadata.
 *
 * Required env vars for R2:
 *   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *   and one of:
 *     - R2_ENDPOINT
 *     - R2_ACCOUNT_ID
 *   Optional:
 *     - R2_PUBLIC_URL (public CDN/custom domain base URL)
 */

const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PRESIGNED_URL_TTL_SECONDS = 600;
const MEDIA_OBJECT_PREFIX = 'uploads';

interface ResolvedR2Config {
    endpoint: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicBaseUrl: string;
}

function stripTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '');
}

function normalizeEndpoint(endpoint: string): string {
    const trimmed = endpoint.trim();
    if (!trimmed) return trimmed;
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return stripTrailingSlash(withProtocol);
}

function resolveR2Config(): ResolvedR2Config {
    const bucketName = process.env.R2_BUCKET_NAME?.trim();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
    const endpointFromEnv = process.env.R2_ENDPOINT?.trim();
    const accountId = process.env.R2_ACCOUNT_ID?.trim();

    const endpoint = endpointFromEnv
        ? normalizeEndpoint(endpointFromEnv)
        : accountId
            ? `https://${accountId}.r2.cloudflarestorage.com`
            : '';

    if (!bucketName || !accessKeyId || !secretAccessKey || !endpoint) {
        throw new AppError(
            ERROR_CODES.INTERNAL_ERROR,
            'R2 upload is not configured. Set R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ENDPOINT (or R2_ACCOUNT_ID).',
            500,
        );
    }

    const explicitPublicUrl = process.env.R2_PUBLIC_URL?.trim();
    const publicBaseUrl = explicitPublicUrl
        ? stripTrailingSlash(explicitPublicUrl)
        : `${endpoint}/${bucketName}`;

    return {
        endpoint,
        bucketName,
        accessKeyId,
        secretAccessKey,
        publicBaseUrl,
    };
}

function createR2Client(config: ResolvedR2Config): S3Client {
    return new S3Client({
        region: 'auto',
        endpoint: config.endpoint,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });
}

function sanitizeExtension(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext || !/^[a-z0-9]{1,12}$/.test(ext)) {
        return 'bin';
    }
    return ext;
}

function buildObjectKey(tenantId: string, instanceId: string, fileName: string): string {
    const ext = sanitizeExtension(fileName);
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const uniqueId = crypto.randomBytes(16).toString('hex');
    return `${MEDIA_OBJECT_PREFIX}/${tenantId}/${instanceId}/${yyyy}/${mm}/${dd}/${uniqueId}.${ext}`;
}

function cleanEtag(etag?: string): string | null {
    if (!etag) return null;
    return etag.replace(/^"+|"+$/g, '').trim() || null;
}

export class MediaController {
    /**
     * Generate a presigned upload URL and create a pending media record.
     * POST /cms/uploads/presign
     * Body: { fileName, mimeType, fileSize }
     */
    static async presign(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const { fileName, mimeType, fileSize } = req.body;

            if (!fileName || !mimeType) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'fileName and mimeType are required', 400);
            }

            if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Unsupported file type: ${mimeType}`, 400, 'mimeType');
            }

            if (fileSize && fileSize > MAX_FILE_SIZE) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'File size exceeds 10MB limit', 400, 'fileSize');
            }

            const r2Config = resolveR2Config();
            const r2Client = createR2Client(r2Config);
            const objectKey = buildObjectKey(tenantId, instanceId, fileName);
            const publicUrl = `${r2Config.publicBaseUrl}/${objectKey}`;

            const putCommand = new PutObjectCommand({
                Bucket: r2Config.bucketName,
                Key: objectKey,
                ContentType: mimeType,
                CacheControl: 'public, max-age=31536000, immutable',
            });

            // AWS SDK type packages may be duplicated in pnpm workspaces; runtime client is compatible.
            const uploadUrl = await getSignedUrl(r2Client as any, putCommand, {
                expiresIn: PRESIGNED_URL_TTL_SECONDS,
            });

            const mediaAsset = await db.mediaAsset.create({
                data: {
                    tenantId,
                    instanceId,
                    uploadedBy: req.auth?.userId || null,
                    fileName,
                    objectKey,
                    mimeType,
                    fileSize: typeof fileSize === 'number' ? fileSize : 0,
                    bucketName: r2Config.bucketName,
                    publicUrl,
                    status: 'pending',
                    metadataJsonb: { source: 'cms-builder' },
                },
            });

            res.json({
                success: true,
                data: {
                    method: 'presigned',
                    mediaAssetId: mediaAsset.id,
                    objectKey,
                    publicUrl,
                    uploadUrl,
                    expiresIn: PRESIGNED_URL_TTL_SECONDS,
                    headers: { 'Content-Type': mimeType },
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Finalize upload metadata after successful client-side PUT.
     * POST /cms/uploads/complete
     * Body: { mediaAssetId, etag? }
     */
    static async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const { mediaAssetId, etag } = req.body as { mediaAssetId?: string; etag?: string };

            if (!mediaAssetId) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'mediaAssetId is required', 400, 'mediaAssetId');
            }

            const existing = await db.mediaAsset.findFirst({
                where: { id: mediaAssetId, instanceId },
            });

            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Media asset not found', 404);
            }

            const normalizedEtag = cleanEtag(etag);
            const updateData: {
                status: 'uploaded';
                uploadedAt: Date;
                metadataJsonb?: { etag: string };
            } = {
                status: 'uploaded',
                uploadedAt: new Date(),
            };
            if (normalizedEtag) {
                updateData.metadataJsonb = { etag: normalizedEtag };
            }

            const updated = await db.mediaAsset.update({
                where: { id: existing.id },
                data: updateData,
            });

            res.json({
                success: true,
                data: {
                    id: updated.id,
                    objectKey: updated.objectKey,
                    publicUrl: updated.publicUrl,
                    status: updated.status,
                    uploadedAt: updated.uploadedAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

}
