import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';

export class PermissionsController {
    /**
     * List all system permissions, grouped by module.
     */
    static async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const permissions = await db.permission.findMany({
                orderBy: [{ module: 'asc' }, { key: 'asc' }],
            });

            // Group by module
            const grouped: Record<string, Array<{ id: string; key: string; name: string; description: string | null }>> = {};
            for (const perm of permissions) {
                if (!grouped[perm.module]) {
                    grouped[perm.module] = [];
                }
                grouped[perm.module]!.push({
                    id: perm.id,
                    key: perm.key,
                    name: perm.name,
                    description: perm.description,
                });
            }

            res.json({ success: true, data: grouped });
        } catch (error) {
            next(error);
        }
    }
}
