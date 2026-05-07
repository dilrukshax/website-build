import { api } from './api-client';

interface PresignUploadData {
    mediaAssetId: string;
    uploadUrl: string;
    publicUrl: string;
    headers?: Record<string, string>;
}

interface UploadProxyResponse {
    success: boolean;
    data?: {
        etag?: string | null;
    };
    error?: {
        message?: string;
    };
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const SUPPORTED_IMAGE_MIME_TYPES = new Set<string>([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif',
]);

const EXTENSION_TO_MIME: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    jfif: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    avif: 'image/avif',
};

function headersToRecord(headers: Headers): Record<string, string> {
    const record: Record<string, string> = {};
    headers.forEach((value, key) => {
        record[key] = value;
    });
    return record;
}

function readErrorMessage(rawError: unknown, fallbackMessage: string): string {
    if (rawError instanceof Error && rawError.message) {
        return rawError.message;
    }

    return fallbackMessage;
}

function getFileExtension(fileName: string): string {
    const parts = fileName.toLowerCase().split('.');
    if (parts.length < 2) {
        return '';
    }

    return parts[parts.length - 1] || '';
}

function resolveSupportedMimeType(file: File): string {
    const directMime = file.type.trim().toLowerCase();
    if (SUPPORTED_IMAGE_MIME_TYPES.has(directMime)) {
        return directMime;
    }

    const extensionMime = EXTENSION_TO_MIME[getFileExtension(file.name)];
    if (extensionMime && SUPPORTED_IMAGE_MIME_TYPES.has(extensionMime)) {
        return extensionMime;
    }

    throw new Error('Unsupported image format. Use JPG, PNG, WebP, GIF, SVG, or AVIF.');
}

function normalizePublicUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        return trimmed;
    }

    const withProtocol = (() => {
        if (/^https?:\/\//i.test(trimmed)) {
            return trimmed;
        }

        if (trimmed.startsWith('//')) {
            return `https:${trimmed}`;
        }

        if (trimmed.startsWith('/')) {
            if (typeof window !== 'undefined' && window.location?.origin) {
                return `${window.location.origin}${trimmed}`;
            }
            return trimmed;
        }

        return `https://${trimmed}`;
    })();

    try {
        const parsed = new URL(withProtocol);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString();
        }
    } catch {
        // Fall back to the best effort value.
    }

    return withProtocol;
}

async function uploadViaProxy(uploadUrl: string, uploadHeaders: Headers, file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('uploadUrl', uploadUrl);
    formData.append('headers', JSON.stringify(headersToRecord(uploadHeaders)));
    formData.append('file', file);

    let proxyResponse: Response;
    try {
        proxyResponse = await fetch('/api/uploads/proxy', {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
    } catch (error) {
        throw new Error(readErrorMessage(error, 'Upload proxy request failed.'));
    }

    let payload: UploadProxyResponse | null = null;
    try {
        payload = await proxyResponse.json() as UploadProxyResponse;
    } catch {
        payload = null;
    }

    if (!proxyResponse.ok || !payload?.success) {
        throw new Error(payload?.error?.message || `Upload proxy failed with status ${proxyResponse.status}`);
    }

    return typeof payload.data?.etag === 'string' ? payload.data.etag : null;
}

async function uploadDirect(uploadUrl: string, uploadHeaders: Headers, file: File): Promise<string | null> {
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: uploadHeaders,
        body: file,
    });

    if (!uploadResponse.ok) {
        throw new Error(`Image upload failed with status ${uploadResponse.status}`);
    }

    return uploadResponse.headers.get('etag') || null;
}

export async function uploadCmsImage(file: File): Promise<string> {
    const mimeType = resolveSupportedMimeType(file);

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        throw new Error('Image exceeds 10MB upload limit.');
    }

    const presignResponse = await api.post<PresignUploadData>('/cms/uploads/presign', {
        fileName: file.name,
        mimeType,
        fileSize: file.size,
    });

    if (!presignResponse.success || !presignResponse.data) {
        throw new Error(presignResponse.error?.message || 'Unable to prepare image upload.');
    }

    const presignData = presignResponse.data;
    const uploadHeaders = new Headers(presignData.headers || {});
    if (!uploadHeaders.has('Content-Type')) {
        uploadHeaders.set('Content-Type', mimeType);
    }

    let etag: string | null = null;
    try {
        etag = await uploadViaProxy(presignData.uploadUrl, uploadHeaders, file);
    } catch (proxyUploadError) {
        try {
            etag = await uploadDirect(presignData.uploadUrl, uploadHeaders, file);
        } catch (directUploadError) {
            const proxyMessage = readErrorMessage(proxyUploadError, 'Proxy upload failed.');
            const directMessage = readErrorMessage(directUploadError, 'Direct upload failed.');
            throw new Error(`Image upload failed. ${directMessage} ${proxyMessage}`.trim());
        }
    }

    const completeResponse = await api.post('/cms/uploads/complete', {
        mediaAssetId: presignData.mediaAssetId,
        etag: etag || undefined,
    });

    if (!completeResponse.success) {
        throw new Error(completeResponse.error?.message || 'Unable to finalize image upload.');
    }

    return normalizePublicUrl(presignData.publicUrl);
}
