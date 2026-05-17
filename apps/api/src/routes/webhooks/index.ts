import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { PaymentWebhooksController } from '../../controllers/payment-webhooks.controller';

/**
 * Public webhook boundary (design §3/§5/§11). Signature-verified and
 * idempotent in the controller. Kept semantically separate from
 * /auth, /cms, /web per CLAUDE.md Non-Negotiable #3.
 */
const router = Router();

router.post('/payments/:provider', PaymentWebhooksController.handle);

export const webhooksRouter: ExpressRouter = router;
