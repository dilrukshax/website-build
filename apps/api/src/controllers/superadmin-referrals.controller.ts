import { NextFunction, Request, Response } from 'express';
import { ReferralsService } from '../services/referrals.service';
import { ReferralRewardsService } from '../services/referral-rewards.service';

export class SuperAdminReferralsController {
    static async listClaims(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = typeof req.query.status === 'string'
                ? req.query.status as 'pending' | 'verify' | 'review' | 'blocked' | 'rewarded'
                : undefined;

            const data = await ReferralsService.listClaimsForSuperAdmin(status);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async approveClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await ReferralsService.reviewClaim({
                claimId: req.params.id!,
                reviewerUserId: req.auth!.userId,
                action: 'approve',
                notes: req.body.notes,
            });

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async blockClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await ReferralsService.reviewClaim({
                claimId: req.params.id!,
                reviewerUserId: req.auth!.userId,
                action: 'block',
                notes: req.body.reason,
            });

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async approveEnterpriseReward(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await ReferralRewardsService.approveEnterpriseReward({
                claimId: req.params.claimId!,
                tier: req.body.tier,
                reviewerUserId: req.auth!.userId,
            });

            res.json({ success: true, data: { message: 'Enterprise reward approved' } });
        } catch (error) {
            next(error);
        }
    }

    static async rejectEnterpriseReward(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await ReferralRewardsService.rejectEnterpriseReward({
                claimId: req.params.claimId!,
                reviewerUserId: req.auth!.userId,
                reason: req.body.reason,
            });

            res.json({ success: true, data: { message: 'Enterprise reward rejected' } });
        } catch (error) {
            next(error);
        }
    }
}

