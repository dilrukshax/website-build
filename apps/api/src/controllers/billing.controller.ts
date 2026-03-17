import { NextFunction, Request, Response } from 'express';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';
import { BillingService } from '../services/billing.service';

function requireOwner(req: Request): void {
    if (!req.auth || req.auth.role !== 'owner') {
        throw new AppError(ERROR_CODES.FORBIDDEN, 'Only tenant owners can perform billing actions', 403);
    }
}

export class BillingController {
    static async summary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const data = await BillingService.getSummary(tenantId);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async usage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const fromQuery = typeof req.query.instanceId === 'string' ? req.query.instanceId : undefined;
            const fromHeader = typeof req.headers['x-instance-id'] === 'string' ? req.headers['x-instance-id'] : undefined;
            const instanceId = fromQuery || fromHeader;

            const data = await BillingService.getUsage(tenantId, instanceId);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async requestPlanChange(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            requireOwner(req);

            const charge = await BillingService.requestPlanChange({
                tenantId: req.tenant!.id,
                requestedByUserId: req.auth!.userId,
                requestedPlan: req.body.requestedPlan,
                requestedInterval: req.body.requestedInterval,
                notes: req.body.notes,
            });

            res.status(201).json({ success: true, data: charge });
        } catch (error) {
            next(error);
        }
    }

    static async requestAddons(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            requireOwner(req);

            const charge = await BillingService.requestAddonBundles({
                tenantId: req.tenant!.id,
                requestedByUserId: req.auth!.userId,
                bundles: req.body.bundles,
                notes: req.body.notes,
            });

            res.status(201).json({ success: true, data: charge });
        } catch (error) {
            next(error);
        }
    }

    static async redeemPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            requireOwner(req);

            const result = await BillingService.redeemPoints({
                accountId: req.auth!.userId,
                tenantId: req.body.tenantId,
                points: req.body.points,
            });

            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

