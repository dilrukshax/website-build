import { z } from 'zod';

export const presignUploadSchema = z.object({
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(100),
    fileSize: z.number().int().positive().max(10 * 1024 * 1024).optional(),
});

export const completeUploadSchema = z.object({
    mediaAssetId: z.string().uuid('mediaAssetId must be a valid UUID'),
    etag: z.string().max(200).optional(),
});
