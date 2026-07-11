import { NextFunction, Request, Response } from 'express';
import { BillingService } from '../services/billing.service';

export class SuperAdminBillingController {
    static async listCharges(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = typeof req.query.status === 'string'
                ? req.query.status as 'pending' | 'confirmed' | 'rejected'
                : undefined;

            const data = await BillingService.listChargesForSuperAdmin(status);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async confirmCharge(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingService.confirmCharge(req.params.id!, req.auth!.userId);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async rejectCharge(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingService.rejectCharge({
                chargeId: req.params.id!,
                reviewerUserId: req.auth!.userId,
                reason: req.body.reason,
            });

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}

