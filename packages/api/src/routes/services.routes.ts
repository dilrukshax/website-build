import { Router } from 'express';
import { ServicesController } from '../controllers/services.controller';
import { validate } from '../middleware/validate.middleware';
import { createServiceSchema, updateServiceSchema } from '../validators/services.validators';
import { authMiddleware, requireAdmin } from '@booking-engine/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', ServicesController.list);
router.post('/', requireAdmin, validate(createServiceSchema), ServicesController.create);
router.get('/:id', ServicesController.getById);
router.put('/:id', requireAdmin, validate(updateServiceSchema), ServicesController.update);
router.delete('/:id', requireAdmin, ServicesController.delete);

export const servicesRoutes = router;
