import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';

/**
 * Supplier connections (owner, instance-scoped). AliExpress OAuth wiring is a
 * Phase-2 dependency (design §7/§22); v1 supports assisted-manual imports
 * against a created supplier record.
 */
export class SuppliersController {
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const suppliers = await db.supplier.findMany({
                where: { tenantId: req.tenant!.id, instanceId: req.instance!.id },
                orderBy: { createdAt: 'asc' },
            });
            res.json({ success: true, data: suppliers });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const supplier = await db.supplier.create({
                data: {
                    tenantId: req.tenant!.id,
                    instanceId: req.instance!.id,
                    type: req.body.type ?? 'aliexpress',
                    displayName: req.body.displayName,
                    status: 'disconnected',
                },
            });
            res.status(201).json({ success: true, data: supplier });
        } catch (error) {
            next(error);
        }
    }
}
