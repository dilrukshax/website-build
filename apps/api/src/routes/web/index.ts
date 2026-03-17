import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { requireTenant } from '../../middleware/tenant';
import { requireInstance } from '../../middleware/instance';
import { resolvePublicWebContext } from '../../middleware/public-web-context';
import { validate } from '../../middleware/validate';
import { ServicesController } from '../../controllers/services.controller';
import { BookingsController } from '../../controllers/bookings.controller';
import { InquiriesController } from '../../controllers/inquiries.controller';
import { createBookingSchema } from '../../validators/bookings.validators';
import { createInquirySchema } from '../../validators/inquiries.validators';

const router = Router();

// Public web APIs are instance-scoped.
// Host-based context resolution (trusted proxy header) runs before legacy header-based fallback.
router.use(resolvePublicWebContext);
router.use(requireTenant);
router.use(requireInstance);

// --- Services (public read) ---
router.get('/services', ServicesController.listPublic);
router.get('/services/:id', ServicesController.getById);

// --- Bookings (public create — customer self-serve) ---
router.post('/bookings', validate(createBookingSchema), BookingsController.create);

// --- Inquiries (public create) ---
router.post('/inquiries', validate(createInquirySchema), InquiriesController.create);

export const webRouter: ExpressRouter = router;
