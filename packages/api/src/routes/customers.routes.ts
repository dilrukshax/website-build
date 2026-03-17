import { Router } from 'express';
import { CustomersController } from '../controllers/customers.controller';
import { validate } from '../middleware/validate.middleware';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customers.validators';
import { authMiddleware, requireStaff } from '@booking-engine/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', CustomersController.list);
router.post('/', requireStaff, validate(createCustomerSchema), CustomersController.create);
router.get('/:id', CustomersController.getById);
router.put('/:id', requireStaff, validate(updateCustomerSchema), CustomersController.update);
router.delete('/:id', requireStaff, CustomersController.delete);
router.post('/search', CustomersController.search);

export const customersRoutes = router;
