import { Request, Response, NextFunction } from 'express';
import { db } from '@project-aurora/database';
import { AppError } from '../middleware/error';
import { ERROR_CODES } from '@project-aurora/core';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parsePage(raw: unknown): number {
    const parsed = parseInt(String(raw ?? '1'), 10);
    if (Number.isNaN(parsed) || parsed < 1) {
        return 1;
    }

    return parsed;
}

function parseLimit(raw: unknown): number {
    const parsed = parseInt(String(raw ?? DEFAULT_PAGE_SIZE), 10);
    if (Number.isNaN(parsed) || parsed < 1) {
        return DEFAULT_PAGE_SIZE;
    }

    return Math.min(parsed, MAX_PAGE_SIZE);
}

export class FeedbackController {
    static async listRatings(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const page = parsePage(req.query.page);
            const limit = parseLimit(req.query.limit);
            const skip = (page - 1) * limit;

            const where = {
                tenantId,
                type: 'rating' as const,
            };

            const [feedback, total] = await Promise.all([
                db.feedback.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                db.feedback.count({ where }),
            ]);

            res.json({
                success: true,
                data: feedback,
                meta: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async createRating(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const userId = req.auth?.userId;
            if (!userId) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Authentication required', 401);
            }

            const submitter = await db.user.findUnique({
                where: { id: userId },
                select: { email: true, fullName: true },
            });

            const submittedByEmail = submitter?.email || req.user?.email || 'unknown@example.com';
            const submittedByName = submitter?.fullName || 'Unknown User';

            const feedback = await db.feedback.create({
                data: {
                    tenantId,
                    type: 'rating',
                    score: req.body.score,
                    note: req.body.note || null,
                    title: null,
                    message: null,
                    submittedByUserId: userId,
                    submittedByEmail,
                    submittedByName,
                },
            });

            res.status(201).json({ success: true, data: feedback });
        } catch (error) {
            next(error);
        }
    }

    static async listSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const page = parsePage(req.query.page);
            const limit = parseLimit(req.query.limit);
            const skip = (page - 1) * limit;

            const where = {
                tenantId,
                type: 'suggestion' as const,
            };

            const [feedback, total] = await Promise.all([
                db.feedback.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                db.feedback.count({ where }),
            ]);

            res.json({
                success: true,
                data: feedback,
                meta: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async createSuggestion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const userId = req.auth?.userId;
            if (!userId) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Authentication required', 401);
            }

            const submitter = await db.user.findUnique({
                where: { id: userId },
                select: { email: true, fullName: true },
            });

            const submittedByEmail = submitter?.email || req.user?.email || 'unknown@example.com';
            const submittedByName = submitter?.fullName || 'Unknown User';

            const feedback = await db.feedback.create({
                data: {
                    tenantId,
                    type: 'suggestion',
                    score: null,
                    note: null,
                    title: req.body.title,
                    message: req.body.message,
                    submittedByUserId: userId,
                    submittedByEmail,
                    submittedByName,
                },
            });

            res.status(201).json({ success: true, data: feedback });
        } catch (error) {
            next(error);
        }
    }

    static async listSuperAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = parsePage(req.query.page);
            const limit = parseLimit(req.query.limit);
            const skip = (page - 1) * limit;

            const tenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId : undefined;
            const type = typeof req.query.type === 'string' ? req.query.type : undefined;

            if (type && type !== 'rating' && type !== 'suggestion') {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid type filter', 400, 'type');
            }

            const where = {
                ...(tenantId ? { tenantId } : {}),
                ...(type ? { type: type as 'rating' | 'suggestion' } : {}),
            };

            const [feedback, total] = await Promise.all([
                db.feedback.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        tenant: {
                            select: {
                                id: true,
                                businessName: true,
                            },
                        },
                    },
                }),
                db.feedback.count({ where }),
            ]);

            res.json({
                success: true,
                data: feedback,
                meta: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
