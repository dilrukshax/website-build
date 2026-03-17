import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '@booking-engine/core';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d';

export class JWTService {
    static generateAccessToken(payload: JWTPayload): string {
        const data: Record<string, unknown> = { userId: payload.userId, email: payload.email };
        if (payload.tenantId) data.tenantId = payload.tenantId;
        if (payload.role) data.role = payload.role;
        if (payload.isSuperAdmin !== undefined) data.isSuperAdmin = payload.isSuperAdmin;
        const options: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRY as unknown as number };
        return jwt.sign(data, JWT_SECRET, options);
    }

    static generateRefreshToken(payload: JWTPayload): string {
        const data: Record<string, unknown> = { userId: payload.userId, email: payload.email };
        if (payload.tenantId) data.tenantId = payload.tenantId;
        if (payload.role) data.role = payload.role;
        if (payload.isSuperAdmin !== undefined) data.isSuperAdmin = payload.isSuperAdmin;
        const options: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRY as unknown as number };
        return jwt.sign(data, JWT_REFRESH_SECRET, options);
    }

    static verifyAccessToken(token: string): JWTPayload {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    }

    static verifyRefreshToken(token: string): JWTPayload {
        return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    }

    static generateTokenPair(payload: JWTPayload) {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
        };
    }
}
