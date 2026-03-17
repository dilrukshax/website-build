import { db } from '@booking-engine/database';

export interface TenantUsageSnapshot {
    instances: number;
    customDomains: number;
    staffAccounts: number;
}

export interface InstanceUsageSnapshot {
    pages: number;
    activeServices: number;
    bookingsInDay: number;
}

interface DayBounds {
    start: Date;
    end: Date;
}

function readLocalDateParts(value: Date, timeZone: string): { year: number; month: number; day: number } {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    const parts = formatter.formatToParts(value);
    const map = new Map(parts.map((part) => [part.type, part.value]));

    return {
        year: Number(map.get('year')),
        month: Number(map.get('month')),
        day: Number(map.get('day')),
    };
}

/**
 * Converts a local calendar day at midnight for the target timezone into a UTC Date.
 * This keeps enforcement aligned with the configured instance timezone.
 */
function zonedMidnightUtc(year: number, month: number, day: number, timeZone: string): Date {
    const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const tzLocal = new Date(utcGuess.toLocaleString('en-US', { timeZone }));
    const offsetMs = utcGuess.getTime() - tzLocal.getTime();
    return new Date(utcGuess.getTime() + offsetMs);
}

export function getBookingDayBounds(referenceDate: Date, timeZone?: string | null): DayBounds {
    const safeTimezone = (timeZone || 'UTC').trim() || 'UTC';
    const local = readLocalDateParts(referenceDate, safeTimezone);
    const start = zonedMidnightUtc(local.year, local.month, local.day, safeTimezone);
    const end = new Date(start.getTime() + (24 * 60 * 60 * 1000));
    return { start, end };
}

export class UsageService {
    static async getTenantUsage(tenantId: string): Promise<TenantUsageSnapshot> {
        const [instances, customDomains, staffAccounts] = await Promise.all([
            db.instance.count({ where: { tenantId, status: 'active' } }),
            db.instance.count({ where: { tenantId, status: 'active', customDomain: { not: null } } }),
            db.userTenant.count({ where: { tenantId, status: 'active', isOwner: false } }),
        ]);

        return {
            instances,
            customDomains,
            staffAccounts,
        };
    }

    static async getInstanceUsage(input: {
        tenantId: string;
        instanceId: string;
        bookingDate?: Date;
        timezone?: string | null;
    }): Promise<InstanceUsageSnapshot> {
        const bookingDate = input.bookingDate || new Date();
        const { start, end } = getBookingDayBounds(bookingDate, input.timezone);

        const [pages, activeServices, bookingsInDay] = await Promise.all([
            db.page.count({ where: { tenantId: input.tenantId, instanceId: input.instanceId } }),
            db.service.count({ where: { tenantId: input.tenantId, instanceId: input.instanceId, isActive: true } }),
            db.booking.count({
                where: {
                    tenantId: input.tenantId,
                    instanceId: input.instanceId,
                    startTime: {
                        gte: start,
                        lt: end,
                    },
                    status: {
                        in: ['pending', 'confirmed', 'completed'],
                    },
                },
            }),
        ]);

        return {
            pages,
            activeServices,
            bookingsInDay,
        };
    }

    static async getBookingsInDay(input: {
        tenantId: string;
        instanceId: string;
        bookingDate: Date;
        timezone?: string | null;
    }): Promise<number> {
        const { start, end } = getBookingDayBounds(input.bookingDate, input.timezone);

        return db.booking.count({
            where: {
                tenantId: input.tenantId,
                instanceId: input.instanceId,
                startTime: {
                    gte: start,
                    lt: end,
                },
                status: {
                    in: ['pending', 'confirmed', 'completed'],
                },
            },
        });
    }
}
