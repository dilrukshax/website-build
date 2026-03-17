import {
    logger,
    ERROR_CODES,
} from '@booking-engine/core';
import { db, Prisma } from '@booking-engine/database';
import { BookingStateMachine } from '../workflows/booking-state-machine';
import { AvailabilityService } from './availability.service';
import { AppError } from '@booking-engine/auth';

interface CreateBookingInput {
    customerId: string;
    serviceId: string;
    startTime: Date;
    endTime: Date;
    participants?: number;
    notes?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Core booking business logic service
 */
export class BookingService {
    /**
     * Create a new booking with availability check
     */
    static async createBooking(tenantId: string, input: CreateBookingInput): Promise<Prisma.BookingGetPayload<{}>> {
        const {
            customerId,
            serviceId,
            startTime,
            endTime,
            notes,
        } = input;

        // Validate customer exists
        const customer = await db.customer.findFirst({
            where: { id: customerId, tenantId }
        });
        if (!customer) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Customer not found', 404);
        }

        // Validate service exists
        const service = await db.service.findFirst({
            where: { id: serviceId, tenantId }
        });
        if (!service) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Service not found', 404);
        }

        // Check availability
        const isAvailable = await AvailabilityService.checkAvailability(
            tenantId,
            serviceId,
            startTime,
            endTime,
            input.participants || 1 // Use input.participants directly
        );

        if (!isAvailable) {
            throw new AppError(
                ERROR_CODES.BOOKING_NOT_AVAILABLE,
                'The requested time slot is not available',
                409
            );
        }

        // Calculate duration
        // Create booking
        const booking = await db.booking.create({
            data: {
                tenantId,
                instanceId: service.instanceId,
                customerId,
                serviceId,
                status: 'pending',
                startTime,
                endTime,
                totalPrice: service.price,
                currency: service.currency,
                notes: notes || null,
            }
        });

        logger.info('Booking created', {
            tenantId,
            bookingId: booking.id
        });

        return booking;
    }

    /**
     * Confirm a pending booking
     */
    static async confirmBooking(tenantId: string, bookingId: string): Promise<Prisma.BookingGetPayload<{}>> {
        const booking = await db.booking.findFirst({
            where: { id: bookingId, tenantId }
        });
        if (!booking) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);
        }

        BookingStateMachine.validateTransition(booking.status, 'confirmed');

        const updated = await db.booking.update({
            where: { id: bookingId },
            data: { status: 'confirmed' }
        });

        logger.info('Booking confirmed', { tenantId, bookingId });
        return updated;
    }

    /**
     * Cancel a booking
     */
    static async cancelBooking(
        tenantId: string,
        bookingId: string,
        reason?: string
    ): Promise<Prisma.BookingGetPayload<{}>> {
        const booking = await db.booking.findFirst({
            where: { id: bookingId, tenantId }
        });
        if (!booking) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);
        }

        BookingStateMachine.validateTransition(booking.status, 'cancelled');

        const updated = await db.booking.update({
            where: { id: bookingId },
            data: { 
                status: 'cancelled'
            }
        });

        logger.info('Booking cancelled', { tenantId, bookingId, reason });
        return updated;
    }

    /**
     * Mark booking as completed
     */
    static async completeBooking(tenantId: string, bookingId: string): Promise<Prisma.BookingGetPayload<{}>> {
        const booking = await db.booking.findFirst({
            where: { id: bookingId, tenantId }
        });
        if (!booking) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Booking not found', 404);
        }

        BookingStateMachine.validateTransition(booking.status, 'completed');

        const updated = await db.booking.update({
            where: { id: bookingId },
            data: { status: 'completed' }
        });

        logger.info('Booking completed', { tenantId, bookingId });
        return updated;
    }
}
