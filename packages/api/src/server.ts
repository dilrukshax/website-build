import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '@booking-engine/core';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error-handler.middleware';

// Load .env from the monorepo root BEFORE any workspace package is imported/initialized
// server.ts is at packages/api/src/ → 3 levels up is the monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

interface WildcardOriginRule {
    protocol: string;
    hostSuffix: string;
    port: string;
}

function normalizeOrigin(origin: string): string {
    try {
        const parsed = new URL(origin);
        return `${parsed.protocol}//${parsed.host}`.toLowerCase();
    } catch {
        return '';
    }
}

function matchesWildcardRule(origin: URL, rule: WildcardOriginRule): boolean {
    if (origin.protocol.toLowerCase() !== rule.protocol) {
        return false;
    }

    const hostname = origin.hostname.toLowerCase();
    if (!hostname.endsWith(`.${rule.hostSuffix}`)) {
        return false;
    }

    if (!rule.port) {
        return true;
    }

    return origin.port === rule.port;
}

function parseCorsOriginConfig(raw: string | undefined): {
    allowAny: boolean;
    exact: Set<string>;
    wildcards: WildcardOriginRule[];
} {
    const value = (raw || '').trim();
    if (!value || value === '*') {
        return { allowAny: true, exact: new Set<string>(), wildcards: [] };
    }

    const exact = new Set<string>();
    const wildcards: WildcardOriginRule[] = [];

    for (const entry of value.split(',').map((item) => item.trim()).filter(Boolean)) {
        const wildcardMatch = entry.match(/^(https?):\/\/\*\.([a-z0-9.-]+)(?::(\d+))?$/i);
        if (wildcardMatch) {
            wildcards.push({
                protocol: `${wildcardMatch[1]!.toLowerCase()}:`,
                hostSuffix: wildcardMatch[2]!.toLowerCase(),
                port: wildcardMatch[3] || '',
            });
            continue;
        }

        const normalized = normalizeOrigin(entry);
        if (normalized) {
            exact.add(normalized);
        }
    }

    return { allowAny: false, exact, wildcards };
}

const corsOriginConfig = parseCorsOriginConfig(process.env.CORS_ORIGIN);

// =============================================================
// Middleware Stack
// =============================================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
    origin: (requestOrigin, callback) => {
        // Non-browser and same-origin backend requests (no Origin header) are allowed.
        if (!requestOrigin) {
            callback(null, true);
            return;
        }

        if (corsOriginConfig.allowAny) {
            // With credentials enabled, reflect the request origin instead of using "*".
            callback(null, requestOrigin);
            return;
        }

        const normalized = normalizeOrigin(requestOrigin);
        if (!normalized) {
            callback(null, false);
            return;
        }

        if (corsOriginConfig.exact.has(normalized)) {
            callback(null, requestOrigin);
            return;
        }

        try {
            const parsed = new URL(normalized);
            const matchesWildcard = corsOriginConfig.wildcards.some((rule) => matchesWildcardRule(parsed, rule));
            callback(null, matchesWildcard ? requestOrigin : false);
            return;
        } catch {
            callback(null, false);
            return;
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('short', {
    stream: {
        write: (message: string) => logger.info(message.trim()),
    },
}));

// =============================================================
// Routes
// =============================================================

// Health check
app.get('/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        },
    });
});

// API v1 routes
app.use('/api/v1', apiRouter);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        errors: [{ code: 'NOT_FOUND', message: 'Route not found' }],
    });
});

// Global error handler
app.use(errorHandler);

// =============================================================
// Start Server
// =============================================================

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger.info(`🚀 buildmyonlineweb API running on port ${PORT}`);
        logger.info(`📚 Health check: http://localhost:${PORT}/health`);
        logger.info(`🔗 API base: http://localhost:${PORT}/api/v1`);
    });
}

export default app;
