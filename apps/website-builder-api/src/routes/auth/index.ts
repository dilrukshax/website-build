import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authMiddleware } from '@project-aurora/auth';
import { AuthController } from '../../controllers/auth.controller';
import { validate } from '../../middleware/validate';
import {
    registerSchema,
    loginSchema,
    refreshSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    switchTenantSchema,
} from '../../validators/auth.validators';

import {
    loginLimiter,
    registerLimiter,
    refreshLimiter,
    forgotPasswordLimiter,
} from '../../middleware/rate-limit';

const router = Router();

// Public routes
router.post('/register', registerLimiter, validate(registerSchema), AuthController.register);
router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', refreshLimiter, validate(refreshSchema), AuthController.refresh);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', forgotPasswordLimiter, validate(resetPasswordSchema), AuthController.resetPassword);

// Authenticated routes
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/me', authMiddleware, AuthController.me);
router.post('/switch-tenant', authMiddleware, validate(switchTenantSchema), AuthController.switchTenant);

export const authRouter: ExpressRouter = router;
