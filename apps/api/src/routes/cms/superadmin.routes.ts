import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireSuperAdmin } from '../../middleware/superadmin';
import { SuperAdminController } from '../../controllers/superadmin.controller';

const router = Router();

// These routes require standard authentication PLUS the Super Admin flag
router.use(requireAuth);
router.use(requireSuperAdmin);

// Super Admin functionality for tenants
router.get('/', SuperAdminController.listTenants);
router.get('/:id', SuperAdminController.getTenantDetails);
router.get('/:id/staff', SuperAdminController.listTenantStaff);
router.put('/:id/status', SuperAdminController.updateTenantStatus);

export const superAdminRouter: ExpressRouter = router;
