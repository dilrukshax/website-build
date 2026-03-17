import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { customersRoutes } from './customers.routes';
import { servicesRoutes } from './services.routes';
import { bookingsRoutes } from './bookings.routes';
import { inquiriesRoutes } from './inquiries.routes';

const router = Router();

// Mount all API route groups
router.use('/auth', authRoutes);
router.use('/customers', customersRoutes);
router.use('/services', servicesRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/inquiries', inquiriesRoutes);

// Health check for API v1
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            version: 'v1',
            timestamp: new Date().toISOString(),
        },
    });
});

export const apiRouter = router;
