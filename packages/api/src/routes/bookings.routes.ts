import { Router } from 'express';
import { BookingsController } from '../controllers/bookings.controller';
import { validate } from '../middleware/validate.middleware';
import { createBookingSchema, cancelBookingSchema, checkAvailabilitySchema } from '../validators/bookings.validators';
import { authMiddleware, requireStaff } from '@booking-engine/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', BookingsController.list);
router.post('/', requireStaff, validate(createBookingSchema), BookingsController.create);
router.get('/calendar', BookingsController.calendar);
router.get('/stats', BookingsController.getStats);
router.post('/check-availability', validate(checkAvailabilitySchema), BookingsController.checkAvailability);
router.get('/:id', BookingsController.getById);
router.post('/:id/confirm', requireStaff, BookingsController.confirm);
router.post('/:id/complete', requireStaff, BookingsController.complete);
router.delete('/:id', requireStaff, validate(cancelBookingSchema), BookingsController.cancel);

export const bookingsRoutes = router;
