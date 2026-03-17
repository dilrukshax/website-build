import {
    // AvailabilityRule, // Removed as isInAvailableSlot is commented out
    // logger, // Not used in the provided code
} from '@booking-engine/core';
import {
    // availabilityRepository, // Not used, direct db calls
    // bookingsRepository, // Not used, direct db calls
    // servicesRepository, // Not used, direct db calls
} from '@booking-engine/database';
import { db } from '@booking-engine/database';

interface TimeSlot {
    start: Date;
    end: Date;
}

/**
 * Service for checking and calculating availability
 */
export class AvailabilityService {
    /**
     * Check if a specific time slot is available for booking
     */
    static async checkAvailability(
        tenantId: string,
        serviceId: string,
        startTime: Date,
        endTime: Date,
        participants: number = 1
    ): Promise<boolean> {
        // 1. Check service exists and is active
        const service = await db.service.findFirst({
            where: { id: serviceId, tenantId }
        });
        if (!service || !service.isActive) return false;

        // 2. Check availability rules
        // FIXME: availabilityRule missing from Prisma schema.
        // Needs a real DB model or hardcoded for now when schema isn't present
        // const rules = await availabilityRepository.getRulesForDate(
        //     tenantId,
        //     serviceId,
        //     startTime
        // );

        // if (!this.isInAvailableSlot(startTime, endTime, rules)) {
        //     return false;
        // }

        // 3. Check existing bookings for conflicts
        const conflictingBookings = await db.booking.findMany({
            where: {
                tenantId,
                serviceId,
                status: {
                    notIn: ['cancelled', 'completed']
                },
                OR: [
                    {
                        AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }]
                    },
                    {
                        AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }]
                    }
                ]
            }
        });

        // Bookings in Prisma schema don't seem to have participants recorded.
        // If there's no participants field, we assume 1 participant per booking for capacity calculation.
        const currentCapacity = conflictingBookings.length;

        // Prisma Service schema doesn't have a capacity field. Defaulting to 1 if not present on actual DB row (which it isn't in Prisma).
        return (currentCapacity + participants) <= 1;
    }

    /**
     * Get available time slots for a service on a specific date
     */
    static async getAvailableSlots(
        tenantId: string,
        serviceId: string,
        _date: Date
    ): Promise<TimeSlot[]> {
        const service = await db.service.findFirst({
            where: { id: serviceId, tenantId }
        });
        if (!service || !service.duration) return [];

        // const rules = await availabilityRepository.getRulesForDate(
        //     tenantId,
        //     serviceId,
        //     date
        // );

        const slots: TimeSlot[] = [];
        return slots;
    }

    /**
     * Check if a time range falls within available rule windows
     */
    // private static isInAvailableSlot(
    //     startTime: Date,
    //     endTime: Date,
    //     rules: AvailabilityRule[]
    // ): boolean {
    //     // If no rules, default to not available
    //     if (rules.length === 0) return true; // Default: available if no rules set

    //     // Check for blackout periods first
    //     for (const rule of rules) {
    //         if (rule.ruleType === 'blackout' && rule.isAvailable === false) {
    //             return false;
    //         }
    //     }

    //     // Check if within any available window
    //     for (const rule of rules) {
    //         if (!rule.isAvailable || !rule.startTime || !rule.endTime) continue;

    //         const [ruleStartH, ruleStartM] = rule.startTime.split(':').map(Number);
    //         const [ruleEndH, ruleEndM] = rule.endTime.split(':').map(Number);

    //         const startHour = startTime.getHours();
    //         const startMinute = startTime.getMinutes();
    //         const endHour = endTime.getHours();
    //         const endMinute = endTime.getMinutes();

    //         const startInRange =
    //             startHour > ruleStartH ||
    //             (startHour === ruleStartH && startMinute >= ruleStartM);
    //         const endInRange =
    //             endHour < ruleEndH ||
    //             (endHour === ruleEndH && endMinute <= ruleEndM);

    //         if (startInRange && endInRange) {
    //             return true;
    //         }
    //     }

    //     return false;
    // }
}
