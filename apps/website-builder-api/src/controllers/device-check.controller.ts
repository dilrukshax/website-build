import { NextFunction, Request, Response } from 'express';
import { DeviceRiskService } from '../services/device-risk.service';
import { extractClientIp } from '../utils/request-ip';

export class DeviceCheckController {
    static async check(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const accountIdFromAuth = req.auth?.userId;
            const accountIdFromBody = typeof req.body.accountId === 'string' ? req.body.accountId : undefined;
            const accountId = accountIdFromAuth || accountIdFromBody;

            const riskResult = await DeviceRiskService.evaluateAndPersist(
                {
                    ...req.body,
                    accountId,
                },
                extractClientIp(req),
            );

            res.status(200).json({
                success: true,
                data: {
                    riskLevel: riskResult.riskLevel,
                    riskScore: riskResult.riskScore,
                    action: riskResult.action,
                    flags: riskResult.flags,
                    deviceId: riskResult.deviceId,
                    proofToken: riskResult.proofToken,
                    proofExpiresAt: riskResult.proofExpiresAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
