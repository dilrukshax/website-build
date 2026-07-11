import { Request, Response, NextFunction } from 'express';
import { RoutingIndexService } from '../services/routing-index.service';

export class RoutingIndexController {
    static async rebuild(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const payload = req.body && typeof req.body === 'object'
                ? req.body as { changedHosts?: unknown }
                : {};
            const changedHosts = Array.isArray(payload.changedHosts)
                ? payload.changedHosts as string[]
                : [];

            const result = await RoutingIndexService.rebuildAndPublish({
                changedHosts,
                purgeCache: true,
            });

            res.json({
                success: true,
                data: {
                    version: result.pointer.version,
                    generatedAt: result.pointer.generatedAt,
                    indexKey: result.pointer.indexKey,
                    indexUrl: result.pointer.indexUrl,
                    hostCount: result.pointer.hostCount,
                    changedHosts: result.changedHosts,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
