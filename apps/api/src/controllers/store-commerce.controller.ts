import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { getOrCreateStoreProfile } from '../services/commerce.service';

/**
 * Store commerce profile + policies + pricing rule (owner, instance-scoped).
 * See design §6.1/§8/§17.
 */
export class StoreCommerceController {
    static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const profile = await getOrCreateStoreProfile(req.tenant!.id, req.instance!.id);
            res.json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    }

    static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            await getOrCreateStoreProfile(tenantId, instanceId);
            const profile = await db.storeCommerceProfile.update({
                where: { instanceId },
                data: req.body,
            });
            res.json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    }

    static async getPricingRule(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const rule = await db.pricingRule.findUnique({
                where: { instanceId: req.instance!.id },
            });
            res.json({ success: true, data: rule });
        } catch (error) {
            next(error);
        }
    }

    static async upsertPricingRule(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const rule = await db.pricingRule.upsert({
                where: { instanceId },
                create: { tenantId, instanceId, ...req.body },
                update: req.body,
            });
            res.json({ success: true, data: rule });
        } catch (error) {
            next(error);
        }
    }
}
