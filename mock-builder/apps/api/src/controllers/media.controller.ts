import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

/**
 * Media upload controller.
 *
 * In production, this generates presigned URLs for direct upload to R2/S3.
 * In development (no R2 configured), it returns a local upload endpoint.
 *
 * Required env vars for R2:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
 */

const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm',
    'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class MediaController {
    /**
     * Generate a presigned upload URL (or local upload key).
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

            // Generate a unique object key
            const ext = fileName.split('.').pop() || 'bin';
            const uniqueId = crypto.randomBytes(16).toString('hex');
            const objectKey = `uploads/${tenantId}/${instanceId}/${uniqueId}.${ext}`;

            const r2BucketName = process.env.R2_BUCKET_NAME;
            const r2PublicUrl = process.env.R2_PUBLIC_URL;

            if (r2BucketName && process.env.R2_ACCESS_KEY_ID) {
                // R2/S3-compatible presigned URL generation
                // This is a placeholder — in production, use @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner
                const publicUrl = `${r2PublicUrl || `https://${r2BucketName}.r2.cloudflarestorage.com`}/${objectKey}`;

                res.json({
                    success: true,
                    data: {
                        method: 'presigned',
                        objectKey,
                        publicUrl,
                        uploadUrl: publicUrl, // In real impl, this is the presigned PUT URL
                        expiresIn: 600,
                        headers: { 'Content-Type': mimeType },
                    },
                });
            } else {
                // Development fallback: return a local upload endpoint
                const uploadUrl = `/cms/uploads/local`;
                const publicUrl = `/uploads/${objectKey}`;

                res.json({
                    success: true,
                    data: {
                        method: 'local',
                        objectKey,
                        publicUrl,
                        uploadUrl,
                        expiresIn: 600,
                    },
                });
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Local file upload endpoint (development only).
     * POST /cms/uploads/local
     * In production, uploads go directly to R2 via presigned URL.
     */
    static async localUpload(_req: Request, _res: Response, next: NextFunction): Promise<void> {
        try {
            // This would be implemented with multer for actual file handling.
            // For now, return a placeholder indicating local uploads need multer setup.
            throw new AppError(
                ERROR_CODES.INTERNAL_ERROR,
                'Local upload not yet configured. Set R2_BUCKET_NAME env var for production uploads, or configure multer for local dev.',
                501,
            );
        } catch (error) {
            next(error);
        }
    }
}
