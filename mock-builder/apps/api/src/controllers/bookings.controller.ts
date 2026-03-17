import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { AppError } from '../middleware/error';
import { ERROR_CODES } from '@booking-engine/core';

export class BookingsController {
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const page = parseInt(req.query.page as string || '1', 10);
            const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 100);
            const skip = (page - 1) * limit;
            const status = req.query.status as string | undefined;

            const where = { tenantId, instanceId, ...(status && { status: status as never }) };

            const [bookings, total] = await Promise.all([
                db.booking.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { startTime: 'desc' },
                    include: { customer: true, service: true },
                }),
                db.booking.count({ where }),
            ]);

            res.json({
                success: true,
                data: bookings,
                meta: { page, limit, total, pages: Math.ceil(total / limit) },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const booking = await db.booking.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
                include: { customer: true, service: true },
            });
            if (!booking) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);
            }
            res.json({ success: true, data: booking });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const body = req.body as {
                customerId?: string;
                customer?: { firstName: string; lastName: string; email: string; phone?: string };
                serviceId: string;
                startTime: string;
                endTime: string;
                notes?: string;
            };

            const service = await db.service.findFirst({
                where: { id: body.serviceId, tenantId, instanceId, isActive: true },
            });
            if (!service) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Service not found', 404);
            }

            let customerId = body.customerId;

            if (!customerId && body.customer) {
                // Upsert customer by email for this instance
                const existingCustomer = await db.customer.findUnique({
                    where: { instanceId_email: { instanceId, email: body.customer.email } },
                });
                if (existingCustomer) {
                    customerId = existingCustomer.id;
                    // Optionally update their name/phone if changed
                } else {
                    const newCustomer = await db.customer.create({
                        data: {
                            tenantId,
                            instanceId,
                            firstName: body.customer.firstName,
                            lastName: body.customer.lastName,
                            email: body.customer.email,
                            phone: body.customer.phone,
                        },
                    });
                    customerId = newCustomer.id;
                }
            }

            if (!customerId) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Customer information required', 400);
            }

            const booking = await db.booking.create({
                data: {
                    tenantId,
                    instanceId,
                    customerId,
                    serviceId: body.serviceId,
                    startTime: new Date(body.startTime),
                    endTime: new Date(body.endTime),
                    totalPrice: service.price,
                    currency: service.currency,
                    notes: body.notes,
                    status: 'pending',
                },
                include: { customer: true, service: true },
            });

            res.status(201).json({ success: true, data: booking });
        } catch (error) {
            next(error);
        }
    }

    static async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const booking = await db.booking.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!booking) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);
            }
            const updated = await db.booking.update({
                where: { id: req.params.id },
                data: { status: 'confirmed' },
            });
            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const booking = await db.booking.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!booking) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);
            }
            const updated = await db.booking.update({
                where: { id: req.params.id },
                data: { status: 'cancelled', notes: req.body.reason || booking.notes },
            });
            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    static async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const booking = await db.booking.findFirst({
                where: { id: req.params.id, tenantId: req.tenant!.id, instanceId: req.instance!.id },
            });
            if (!booking) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);
            }
            const updated = await db.booking.update({
                where: { id: req.params.id },
                data: { status: 'completed' },
            });
            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    static async calendar(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'startDate and endDate are required', 400);
            }
            const bookings = await db.booking.findMany({
                where: {
                    tenantId: req.tenant!.id,
                    instanceId: req.instance!.id,
                    startTime: { gte: new Date(startDate as string) },
                    endTime: { lte: new Date(endDate as string) },
                },
                include: { customer: true, service: true },
                orderBy: { startTime: 'asc' },
            });
            res.json({ success: true, data: bookings });
        } catch (error) {
            next(error);
        }
    }

    static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const [total, pending, confirmed, completed, cancelled] = await Promise.all([
                db.booking.count({ where: { tenantId, instanceId } }),
                db.booking.count({ where: { tenantId, instanceId, status: 'pending' } }),
                db.booking.count({ where: { tenantId, instanceId, status: 'confirmed' } }),
                db.booking.count({ where: { tenantId, instanceId, status: 'completed' } }),
                db.booking.count({ where: { tenantId, instanceId, status: 'cancelled' } }),
            ]);
            res.json({ success: true, data: { total, pending, confirmed, completed, cancelled } });
        } catch (error) {
            next(error);
        }
    }
}
