import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import { logger } from '@booking-engine/core';
import { authRouter } from './routes/auth';
import { cmsRouter } from './routes/cms';
import { webRouter } from './routes/web';
import { errorHandler } from './middleware/error';
import { swaggerSpec } from './swagger';

// Load .env from monorepo root — apps/api/src is 3 levels up from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app: Express = express();
const PORT = parseInt(process.env.API_PORT || '3002', 10);

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
                scriptSrc:  ["'self'", "'unsafe-inline'"],
                styleSrc:   ["'self'", "'unsafe-inline'"],
                imgSrc:     ["'self'", 'data:', 'https:'],
            },
        },
    }),
);

app.use(cors({
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
        : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Instance-ID'],
    credentials: true,
}));

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
    customSiteTitle: 'buildmyonlineweb API Docs',
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
    app.listen(PORT, () => {
        logger.info(`buildmyonlineweb API running on port ${PORT}`);
        logger.info(`Health check: http://localhost:${PORT}/health`);
        logger.info(`CMS routes:   http://localhost:${PORT}/cms`);
        logger.info(`Web routes:   http://localhost:${PORT}/web`);
        logger.info(`API Docs:     http://localhost:${PORT}/docs`);
    });
}

export default app;
