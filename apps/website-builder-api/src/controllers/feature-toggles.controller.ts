import { Request, Response, NextFunction } from 'express';
import { db } from '@project-aurora/database';
import { ERROR_CODES } from '@project-aurora/core';
import { AppError } from '../middleware/error';

export class FeatureTogglesController {
    /**
     * List all feature toggles for the current instance.
     */
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;

            const toggles = await db.featureToggle.findMany({
                where: { instanceId },
                orderBy: { toggleKey: 'asc' },
            });

            res.json({ success: true, data: toggles });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Upsert a feature toggle (create or update).
     */
    static async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const tenantId = req.tenant!.id;
            const { toggleKey, isEnabled } = req.body;

            const existing = await db.featureToggle.findUnique({
                where: { instanceId_toggleKey: { instanceId, toggleKey } },
            });

            let toggle;
            if (existing) {
                toggle = await db.featureToggle.update({
                    where: { id: existing.id },
                    data: { isEnabled },
                });
            } else {
                toggle = await db.featureToggle.create({
                    data: { tenantId, instanceId, toggleKey, isEnabled },
                });
            }

            res.json({ success: true, data: toggle });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Bulk update feature toggles.
     */
    static async bulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const tenantId = req.tenant!.id;
            const { toggles } = req.body as { toggles: Array<{ toggleKey: string; isEnabled: boolean }> };

            const results = await db.$transaction(
                toggles.map((t) =>
                    db.featureToggle.upsert({
                        where: { instanceId_toggleKey: { instanceId, toggleKey: t.toggleKey } },
                        update: { isEnabled: t.isEnabled },
                        create: { tenantId, instanceId, toggleKey: t.toggleKey, isEnabled: t.isEnabled },
                    })
                )
            );

            res.json({ success: true, data: results });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a feature toggle.
     */
    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const id = req.params.id!;

            const toggle = await db.featureToggle.findFirst({
                where: { id, instanceId },
            });
            if (!toggle) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Feature toggle not found', 404);
            }

            await db.featureToggle.delete({ where: { id } });
            res.json({ success: true, data: { message: 'Feature toggle deleted' } });
        } catch (error) {
            next(error);
        }
    }
}
