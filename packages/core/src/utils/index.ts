import { v4 as uuidv4 } from 'uuid';
import type { SDUICondition } from '../types';

// ============================================================
// SDUI Condition Evaluator
// ============================================================

/**
 * Resolve a dot-path like "features.booking" against a context object.
 * Returns undefined if any segment is missing.
 */
function resolvePath(obj: Record<string, unknown>, path: string): unknown {
    const segments = path.split('.');
    let current: unknown = obj;
    for (const seg of segments) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return undefined;
        }
        current = (current as Record<string, unknown>)[seg];
    }
    return current;
}

/**
 * Evaluate a single SDUI condition against a runtime context.
 */
function evaluateSingle(condition: SDUICondition, context: Record<string, unknown>): boolean {
    const resolved = resolvePath(context, condition.path);

    switch (condition.op) {
        case 'exists':
            return resolved !== undefined && resolved !== null;
        case 'notExists':
            return resolved === undefined || resolved === null;
        case 'equals':
            return resolved === condition.value;
        case 'notEquals':
            return resolved !== condition.value;
        case 'gt':
            return typeof resolved === 'number' && typeof condition.value === 'number' && resolved > condition.value;
        case 'lt':
            return typeof resolved === 'number' && typeof condition.value === 'number' && resolved < condition.value;
        default:
            return true;
    }
}

/**
 * Evaluate an array of SDUI conditions (AND logic).
 * Returns true if ALL conditions pass, or if the array is empty/null.
 */
export function evaluateConditions(
    conditions: SDUICondition[] | null | undefined,
    context: Record<string, unknown>,
): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every((c) => evaluateSingle(c, context));
}

/**
 * Generate a unique booking number in the format BK-YYYYMMDD-XXXXX
 */
export function generateBookingNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `BK-${dateStr}-${random}`;
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
    return uuidv4();
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
}

/**
 * Calculate pagination offset from page and limit
 */
export function calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
}

/**
 * Calculate total pages from count and limit
 */
export function calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
}

/**
 * Convert snake_case database rows to camelCase objects
 */
export function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
        result[camelKey] = obj[key];
    }
    return result;
}

/**
 * Convert camelCase objects to snake_case for database queries
 */
export function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        result[snakeKey] = obj[key];
    }
    return result;
}

/**
 * Sanitize a subdomain string (lowercase, alphanumeric + hyphens only)
 */
export function sanitizeSubdomain(input: string): string {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 63);
}
