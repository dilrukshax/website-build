import { Router } from 'express';
import { InquiriesController } from '../controllers/inquiries.controller';
import { authMiddleware, optionalAuthMiddleware, requireStaff } from '@booking-engine/auth';

const router = Router();

// Public endpoint for creating inquiries (from tenant's website)
router.post('/', optionalAuthMiddleware, InquiriesController.create);

// Protected endpoints for managing inquiries
router.get('/', authMiddleware, InquiriesController.list);
router.get('/:id', authMiddleware, InquiriesController.getById);
router.put('/:id', authMiddleware, requireStaff, InquiriesController.update);
router.put('/:id/status', authMiddleware, requireStaff, InquiriesController.updateStatus);
router.delete('/:id', authMiddleware, requireStaff, InquiriesController.delete);

export const inquiriesRoutes = router;
