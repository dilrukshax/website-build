import type { Request, Response, NextFunction } from 'express';
import { db } from '@project-aurora/database';
import { getAnalyticsSummary, isGa4ConfiguredServerSide } from '../services/ga4.service';

interface AnalyticsSettings {
    ga4MeasurementId?: string | null;
    ga4PropertyId?: string | null;
}

export class AnalyticsController {
    /**
     * Get GA4 traffic summary for the active instance's published website.
     * Fails open: when GA4 is not configured (per-site or server-side) it returns
     * a `configured: false` payload instead of a 500 so the dashboard can show a setup CTA.
     */
    static async getSummary(req: Request, res: Response, _next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;

            const instance = await db.instance.findUnique({
                where: { id: instanceId },
                select: { settingsJsonb: true, name: true },
            });

            if (!instance) {
                res.status(404).json({ success: false, error: { code: 'INSTANCE_NOT_FOUND', message: 'Instance not found' } });
                return;
            }

            const analytics = ((instance.settingsJsonb as Record<string, unknown> | null)?.analytics ?? null) as
                | AnalyticsSettings
                | null;

            const propertyId = analytics?.ga4PropertyId?.trim();
            const serverConfigured = isGa4ConfiguredServerSide();

            if (!propertyId || !serverConfigured) {
                res.json({
                    success: true,
                    data: {
                        configured: false,
                        reason: !propertyId
                            ? 'missing_property_id'
                            : 'missing_server_credentials',
                    },
                });
                return;
            }

            const { startDate, endDate } = req.query as { startDate: string; endDate: string };
            const summary = await getAnalyticsSummary(propertyId, startDate, endDate);
            res.json({ success: true, data: summary });
        } catch (error) {
            // Fail open: surface a friendly unconfigured payload instead of 500.
            res.json({
                success: true,
                data: {
                    configured: false,
                    reason: 'fetch_error',
                },
            });
        }
    }
}
