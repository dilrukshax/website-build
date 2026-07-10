import { NextFunction, Request, Response } from 'express';
import { ReferralsService } from '../services/referrals.service';

export class ReferralsController {
    static async getMyReferral(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const accountId = req.auth!.userId;
            const data = await ReferralsService.getMyReferral(accountId);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async claim(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const refereeId = req.auth!.userId;
            const result = await ReferralsService.claimReferral({
                refereeId,
                referralCode: req.body.referralCode,
                proofToken: req.body.proofToken,
            });

            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
