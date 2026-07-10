import { Request, Response, NextFunction } from 'express';
import { db } from '@project-aurora/database';
import { AppError } from '../middleware/error';
import { ERROR_CODES } from '@project-aurora/core';
import {
    normalizeCustomerEmail,
    normalizeOptionalString,
    upsertCustomerByEmail,
} from '../services/customer-upsert.service';

const INQUIRY_SELECT = {
    id: true,
    tenantId: true,
    instanceId: true,
    customerId: true,
    name: true,
    email: true,
    phone: true,
    message: true,
    status: true,
    sourceType: true,
    sourcePageSlug: true,
    createdAt: true,
    updatedAt: true,
    customer: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
        },
    },
} as const;

function normalizeSourcePageSlug(value?: string | null): string | null {
    const sourcePageSlug = normalizeOptionalString(value);
    if (!sourcePageSlug) return null;

    let normalized = sourcePageSlug;
    if (!normalized.startsWith('/')) {
        normalized = `/${normalized}`;
    }

    normalized = normalized.replace(/\/+$/, '').toLowerCase();
    if (!normalized) {
        return '/';
    }

    return normalized;
}

export class InquiriesController {
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const page = parseInt((req.query.page as string) || '1', 10);
            const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 100);
            const skip = (page - 1) * limit;
            const status = req.query.status as string | undefined;

            const where = {
                tenantId,
                instanceId,
                ...(status && { status: status as never }),
            };

            const [inquiries, total] = await Promise.all([
                db.inquiry.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    select: INQUIRY_SELECT,
                }),
                db.inquiry.count({ where }),
            ]);

            res.json({
                success: true,
                data: inquiries,
                meta: { page, limit, total, pages: Math.ceil(total / limit) },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const inquiry = await db.inquiry.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
                select: INQUIRY_SELECT,
            });
            if (!inquiry) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Inquiry not found', 404);
            }
            res.json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant?.id;
            const instanceId = req.instance?.id;
            if (!tenantId || !instanceId) {
                throw new AppError(ERROR_CODES.INSTANCE_REQUIRED, 'Tenant and instance context required', 400);
            }

            const body = req.body as {
                firstName: string;
                lastName: string;
                email: string;
                phone?: string;
                message: string;
                sourceType?: 'contact_form' | 'booking_form';
                sourcePageSlug?: string;
            };

            const firstName = normalizeOptionalString(body.firstName) || '';
            const lastName = normalizeOptionalString(body.lastName) || '';
            const message = normalizeOptionalString(body.message) || '';
            const email = normalizeCustomerEmail(body.email);
            const sourceType = body.sourceType || 'contact_form';
            const sourcePageSlug = normalizeSourcePageSlug(body.sourcePageSlug);

            const customer = await upsertCustomerByEmail({
                tenantId,
                instanceId,
                firstName,
                lastName,
                email,
                phone: body.phone,
            });

            const inquiry = await db.inquiry.create({
                data: {
                    tenantId,
                    instanceId,
                    customerId: customer.id,
                    name: `${firstName} ${lastName}`.trim(),
                    email,
                    phone: normalizeOptionalString(body.phone),
                    message,
                    sourceType,
                    sourcePageSlug,
                },
                select: INQUIRY_SELECT,
            });

            res.status(201).json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const existing = await db.inquiry.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Inquiry not found', 404);
            }
            const inquiry = await db.inquiry.update({
                where: { id: req.params.id },
                data: req.body,
                select: INQUIRY_SELECT,
            });
            res.json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }

    static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const existing = await db.inquiry.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Inquiry not found', 404);
            }
            const inquiry = await db.inquiry.update({
                where: { id: req.params.id },
                data: { status: req.body.status },
                select: INQUIRY_SELECT,
            });
            res.json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const existing = await db.inquiry.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!existing) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Inquiry not found', 404);
            }
            await db.inquiry.delete({ where: { id: req.params.id } });
            res.json({ success: true, data: { message: 'Inquiry deleted' } });
        } catch (error) {
            next(error);
        }
    }
}
