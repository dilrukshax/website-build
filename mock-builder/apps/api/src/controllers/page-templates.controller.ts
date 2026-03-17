import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';

export class PageTemplatesController {
    static async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const templates = await db.pageTemplate.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
            });

            res.json({ success: true, data: templates });
        } catch (error) {
            next(error);
        }
    }
}
