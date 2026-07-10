import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate';
import { deviceCheckSchema } from '../../validators/device-check.validators';
import { DeviceCheckController } from '../../controllers/device-check.controller';
import { ERROR_CODES } from '@project-aurora/core';
import { extractClientIp } from '../../utils/request-ip';

const router = Router();

const maxRequestsPerMinute = Number(process.env.DEVICE_CHECK_RATE_LIMIT_PER_MIN || 10);

const deviceCheckRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: Number.isFinite(maxRequestsPerMinute) ? maxRequestsPerMinute : 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => extractClientIp(req) || 'unknown-ip',
    handler: (_req: Request, res: Response) => {
        res.status(429).json({
            success: false,
            error: {
                code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
                message: 'Too many device checks from this IP. Please try again shortly.',
            },
        });
    },
});

router.post('/', deviceCheckRateLimit, validate(deviceCheckSchema), DeviceCheckController.check);

export const deviceCheckRouter: ExpressRouter = router;
