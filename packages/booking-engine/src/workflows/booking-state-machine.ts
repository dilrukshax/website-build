import { VALID_BOOKING_TRANSITIONS, BookingStatus, ERROR_CODES } from '@booking-engine/core';

/**
 * Booking state machine - validates status transitions
 */
export class BookingStateMachine {
    /**
     * Check if a transition from one status to another is valid
     */
    static canTransition(from: BookingStatus, to: BookingStatus): boolean {
        const allowedTransitions = VALID_BOOKING_TRANSITIONS[from];
        return allowedTransitions ? allowedTransitions.includes(to) : false;
    }

    /**
     * Get allowed transitions from a status
     */
    static getAllowedTransitions(status: BookingStatus): string[] {
        return VALID_BOOKING_TRANSITIONS[status] || [];
    }

    /**
     * Validate a transition, throwing an error if invalid
     */
    static validateTransition(from: BookingStatus, to: BookingStatus): void {
        if (!this.canTransition(from, to)) {
            throw new Error(
                `${ERROR_CODES.INVALID_BOOKING_TRANSITION}: Cannot transition from '${from}' to '${to}'. Allowed: ${this.getAllowedTransitions(from).join(', ') || 'none'}`
            );
        }
    }
}
