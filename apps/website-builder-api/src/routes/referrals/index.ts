import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { ReferralsController } from '../../controllers/referrals.controller';
import { validate } from '../../middleware/validate';
import { claimReferralSchema } from '../../validators/referrals.validators';

const router = Router();

router.get('/me', ReferralsController.getMyReferral);
router.post('/claim', validate(claimReferralSchema), ReferralsController.claim);

export const referralsRouter: ExpressRouter = router;
