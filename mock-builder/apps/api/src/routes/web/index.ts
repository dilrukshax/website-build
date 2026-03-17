import { Router, Request, Response, NextFunction } from 'express';
import type { Router as ExpressRouter } from 'express';
import { requireTenant } from '../../middleware/tenant';
import { requireInstance } from '../../middleware/instance';
import { validate } from '../../middleware/validate';
import { ServicesController } from '../../controllers/services.controller';
import { BookingsController } from '../../controllers/bookings.controller';
import { InquiriesController } from '../../controllers/inquiries.controller';
import { createBookingSchema } from '../../validators/bookings.validators';
import { createInquirySchema } from '../../validators/inquiries.validators';
import { db } from '@booking-engine/database';

const router = Router();

// ============================================================
// Public site preview (no auth, no tenant context required)
// Accessed by subdomain directly
// ============================================================

router.get('/sites/:subdomain', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { subdomain } = req.params;
        const instance = await db.instance.findUnique({ where: { subdomain: subdomain! } });
        if (!instance || instance.status !== 'active') {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } });
            return;
        }

        const record = await db.publishRecord.findFirst({
            where: { instanceId: instance.id, status: 'published' },
            orderBy: { version: 'desc' },
        });

        if (!record || !record.manifestJsonb) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No published version' } });
            return;
        }

        const manifest = record.manifestJsonb as Record<string, unknown>;
        if (!manifest.tenantId) {
            manifest.tenantId = instance.tenantId;
        }

        res.json({ success: true, data: manifest });
    } catch (error) {
        next(error);
    }
});

router.get('/sites/:subdomain/:slug', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { subdomain, slug } = req.params;
        const instance = await db.instance.findUnique({ where: { subdomain: subdomain! } });
        if (!instance || instance.status !== 'active') {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } });
            return;
        }

        const record = await db.publishRecord.findFirst({
            where: { instanceId: instance.id, status: 'published' },
            orderBy: { version: 'desc' },
        });

        if (!record || !record.manifestJsonb) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No published version' } });
            return;
        }

        // Find the specific page in the manifest
        const manifest = record.manifestJsonb as Record<string, unknown>;
        const pages = (manifest as { pages?: Array<{ page: { slug: string } }> }).pages;
        const pageData = pages?.find((p) => p.page.slug === slug);

        if (!pageData) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } });
            return;
        }

        // Inject tenantId if missing
        if (!manifest.tenantId) {
            manifest.tenantId = instance.tenantId;
        }

        res.json({
            success: true,
            data: {
                ...manifest,
                pages: undefined,
                ...pageData,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Tenant resolution applied to all other /web routes
// NO auth — these are public routes
router.use(requireTenant);
router.use(requireInstance); // added instance requirement since public requests resolve the instance scope natively

// --- Services (public read) ---
router.get('/services', ServicesController.list);
router.get('/services/:id', ServicesController.getById);

// --- Bookings (public create — customer self-serve) ---
router.post('/bookings', validate(createBookingSchema), BookingsController.create);

// --- Inquiries (public create) ---
router.post('/inquiries', validate(createInquirySchema), InquiriesController.create);

export const webRouter: ExpressRouter = router;
