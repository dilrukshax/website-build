import { Request } from 'express';

function normalizeIp(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
        return '';
    }

    if (trimmed.startsWith('::ffff:')) {
        return trimmed.slice(7);
    }

    return trimmed;
}

export function extractClientIp(req: Request): string {
    const cfIp = req.headers['cf-connecting-ip'];
    if (typeof cfIp === 'string' && cfIp.trim()) {
        return normalizeIp(cfIp);
    }

    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        const first = forwardedFor.split(',')[0] || '';
        return normalizeIp(first);
    }

    if (Array.isArray(forwardedFor) && forwardedFor[0]) {
        return normalizeIp(forwardedFor[0]);
    }

    if (req.socket?.remoteAddress) {
        return normalizeIp(req.socket.remoteAddress);
    }

    return '';
}
