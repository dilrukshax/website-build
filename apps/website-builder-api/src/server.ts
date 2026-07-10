import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import { logger } from '@project-aurora/core';
import { authRouter } from './routes/auth';
import { cmsRouter } from './routes/cms';
import { webRouter } from './routes/web';
import { deviceCheckRouter } from './routes/device-check';
import { errorHandler } from './middleware/error';
import { swaggerSpec } from './swagger';
import { createDynamicCorsOptionsDelegate } from './middleware/cors';
import { normalizeDomainHost } from './utils/domain';
import { RoutingIndexService } from './services/routing-index.service';

// Load .env from monorepo root in all environments as a best-effort fallback.
// Runtime-provided environment variables still take precedence.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app: Express = express();
const port = Number(process.env.PORT || 5074);
app.set('trust proxy', true);

function buildStaticCorsOrigins(): string {
    const values = new Set<string>();

    for (const raw of (process.env.CORS_ORIGIN || '').split(',')) {
        const value = raw.trim();
        if (value) {
            values.add(value);
        }
    }

    const cmsUrl = (process.env.CMS_URL || '').trim();
    if (cmsUrl) {
        values.add(cmsUrl);
    }

    const siteDomain = normalizeDomainHost(process.env.SITE_DOMAIN || '')
        || normalizeDomainHost(process.env.NEXT_PUBLIC_SITE_DOMAIN || '');
    if (siteDomain) {
        values.add(`https://${siteDomain}`);
        values.add(`https://www.${siteDomain}`);
        values.add(`https://*.${siteDomain}`);
    }

    return Array.from(values).join(',');
}

// =============================================================
// Middleware Stack
// =============================================================

// helmet blocks swagger-ui inline styles/scripts — relax CSP for the /docs route only
app.use('/docs', (_req, _res, next) => next());
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
    }),
);

const corsOptionsDelegate = createDynamicCorsOptionsDelegate({
    staticOriginsRaw: buildStaticCorsOrigins(),
    isKnownActiveHost: async (host) => RoutingIndexService.isKnownActiveHost(host),
});

app.use(cors(corsOptionsDelegate));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan('short', {
    stream: {
        write: (message: string) => logger.info(message.trim()),
    },
}));

// =============================================================
// Routes
// =============================================================

// Swagger UI — development only
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Project Aurora — Website Builder API Docs',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
    },
}));

// Raw OpenAPI JSON spec
app.get('/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

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

// Auth namespace — registration, login, token refresh, password reset
app.use('/auth', authRouter);

// CMS namespace — authenticated routes for tenant staff/owners
app.use('/cms', cmsRouter);

// Web namespace — public routes for frontend themes
app.use('/web', webRouter);

// Public device fingerprint fraud check endpoint
app.use('/api/device-check', deviceCheckRouter);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Route not found',
        },
    });
});

// Global error handler — must be last
app.use(errorHandler);

// =============================================================
// Start Server
// =============================================================

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, '0.0.0.0', () => {
        logger.info(`🚀 Website Builder API running on http://0.0.0.0:${port}`);
        logger.info(`Health check: http://localhost:${port}/health`);
        logger.info(`CMS routes:   http://localhost:${port}/cms`);
        logger.info(`Web routes:   http://localhost:${port}/web`);
        logger.info(`API Docs:     http://localhost:${port}/docs`);
    });
}

export default app;
