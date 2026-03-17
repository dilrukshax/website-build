import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { BookingService, AvailabilityService } from '@booking-engine/booking-engine';
import { AppError } from '@booking-engine/auth';
import { ERROR_CODES, BookingStatus } from '@booking-engine/core';

export class BookingsController {
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const tenantId = req.user!.tenantId as string;
            const { page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc', status } = req.query;
            
            const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
            const take = parseInt(limit as string, 10);
            
            const whereClause = {
                tenantId,
                ...(status ? { status: status as BookingStatus } : {})
            };
            
            const data = await db.booking.findMany({
                where: whereClause,
                skip,
                take,
                orderBy: { [sortBy as string]: sortOrder },
                include: { customer: true, service: true }
            });
            const total = await db.booking.count({ where: whereClause });
            
            res.json({ success: true, data, meta: { total, page: parseInt(page as string, 10), limit: take, totalPages: Math.ceil(total / take) } });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const booking = await db.booking.findFirst({
                where: { id: req.params.id as string, tenantId: req.user!.tenantId as string },
                include: { customer: true, service: true }
            });
            if (!booking) {
                throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);
            }
            res.json({ success: true, data: booking });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const booking = await BookingService.createBooking(req.user!.tenantId as string, {
                ...req.body,
                startTime: new Date(req.body.startTime),
                endTime: new Date(req.body.endTime),
            });
            res.status(201).json({ success: true, data: booking });
        } catch (error) {
            next(error);
        }
    }

    static async confirm(req: Request, res: Response, next: NextFunction) {
        try {
            const booking = await BookingService.confirmBooking(
                req.user!.tenantId as string,
                req.params.id as string
            );
            res.json({ success: true, data: booking });
        } catch (error) {
            next(error);
        }
    }

    static async cancel(req: Request, res: Response, next: NextFunction) {
        try {
            const booking = await BookingService.cancelBooking(
                req.user!.tenantId as string,
                req.params.id as string,
                req.body.reason
            );
            res.json({ success: true, data: booking });
        } catch (error) {
            next(error);
        }
    }

    static async complete(req: Request, res: Response, next: NextFunction) {
        try {
            const booking = await BookingService.completeBooking(
                req.user!.tenantId as string,
                req.params.id as string
            );
            res.json({ success: true, data: booking });
        } catch (error) {
            next(error);
        }
    }

    static async calendar(req: Request, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'startDate and endDate are required', 400);
            }
            const bookings = await db.booking.findMany({
                where: {
                    tenantId: req.user!.tenantId as string,
                    startTime: { gte: new Date(startDate as string) },
                    endTime: { lte: new Date(endDate as string) }
                },
                include: { customer: true, service: true }
            });
            res.json({ success: true, data: bookings });
        } catch (error) {
            next(error);
        }
    }

    static async checkAvailability(req: Request, res: Response, next: NextFunction) {
        try {
            const { serviceId, date } = req.body;
            const slots = await AvailabilityService.getAvailableSlots(
                req.user!.tenantId as string,
                serviceId,
                new Date(date)
            );
            res.json({ success: true, data: { slots } });
        } catch (error) {
            next(error);
        }
    }

    static async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const tenantId = req.user!.tenantId as string;
            
            const total = await db.booking.count({ where: { tenantId } });
            
            const upcoming = await db.booking.count({
                where: {
                    tenantId,
                    status: 'confirmed',
                    startTime: { gte: new Date() }
                }
            });
            
            const pending = await db.booking.count({
                where: { tenantId, status: 'pending' }
            });
            
            const completed = await db.booking.count({
                where: { tenantId, status: 'completed' }
            });
            
            const cancelled = await db.booking.count({
                where: { tenantId, status: 'cancelled' }
            });
            
            const revenueAgg = await db.booking.aggregate({
                where: { tenantId, status: 'completed' },
                _sum: { totalPrice: true }
            });
            const revenue = revenueAgg._sum.totalPrice || 0;

            res.json({ success: true, data: { total, upcoming, pending, completed, cancelled, revenue } });
        } catch (error) {
            next(error);
        }
    }
}
