import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { requireTenant } from '../../middleware/tenant';
import { requireInstance } from '../../middleware/instance';
import { resolvePublicWebContext } from '../../middleware/public-web-context';
import { validate } from '../../middleware/validate';
import { ServicesController } from '../../controllers/services.controller';
import { ProductsController } from '../../controllers/products.controller';
import { BlogsController } from '../../controllers/blogs.controller';
import { BookingsController } from '../../controllers/bookings.controller';
import { InquiriesController } from '../../controllers/inquiries.controller';
import { PublicSitesController } from '../../controllers/public-sites.controller';
import { createBookingSchema } from '../../validators/bookings.validators';
import { createInquirySchema } from '../../validators/inquiries.validators';

const router = Router();

// Public fallback used by custom-domain preview flow when routing-index entries are stale/missing.
router.get('/sites/:subdomain', PublicSitesController.getPublishedBySubdomain);

// Public web APIs are instance-scoped.
// Host-based context resolution (trusted proxy header) runs before legacy header-based fallback.
router.use(resolvePublicWebContext);
router.use(requireTenant);
router.use(requireInstance);

// --- Services (public read) ---
router.get('/services', ServicesController.listPublic);
router.get('/services/:id', ServicesController.getById);

// --- Products (public read) ---
router.get('/products', ProductsController.listPublic);
router.get('/products/:id', ProductsController.getById);

// --- Blogs (public read) ---
router.get('/blogs', BlogsController.listPublic);
router.get('/blogs/:slug', BlogsController.getBySlugPublic);

import { bookingLimiter, inquiryLimiter } from '../../middleware/rate-limit';

// --- Bookings (public create — customer self-serve) ---
router.post('/bookings', bookingLimiter, validate(createBookingSchema), BookingsController.create);

// --- Inquiries (public create) ---
router.post('/inquiries', inquiryLimiter, validate(createInquirySchema), InquiriesController.create);

export const webRouter: ExpressRouter = router;
