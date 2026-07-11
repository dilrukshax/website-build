// ============================================================
// Application Constants
// ============================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'] as const;
export const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid', 'refunded'] as const;
export const INQUIRY_TYPES = ['general', 'quote', 'booking_request'] as const;
export const INQUIRY_STATUSES = ['new', 'in_progress', 'converted', 'closed'] as const;
export const USER_ROLES = ['owner', 'admin', 'staff', 'readonly'] as const;
export const TENANT_STATUSES = ['active', 'inactive', 'suspended', 'pending'] as const;
export const PLAN_TIERS = ['free', 'starter', 'freelance', 'enterprise'] as const;

// Booking status transitions (state machine)
export const VALID_BOOKING_TRANSITIONS: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled', 'no_show'],
    cancelled: [],
    completed: [],
    no_show: [],
};

// ============================================================
// Error Codes
// ============================================================

export const ERROR_CODES = {
    // Auth errors
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',

    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',

    // Resource errors
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    CONFLICT: 'CONFLICT',

    // Tenant errors
    TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
    TENANT_INACTIVE: 'TENANT_INACTIVE',
    SUBDOMAIN_TAKEN: 'SUBDOMAIN_TAKEN',

    // Instance errors
    INSTANCE_NOT_FOUND: 'INSTANCE_NOT_FOUND',
    INSTANCE_INACTIVE: 'INSTANCE_INACTIVE',
    INSTANCE_REQUIRED: 'INSTANCE_REQUIRED',

    // Booking errors
    BOOKING_NOT_AVAILABLE: 'BOOKING_NOT_AVAILABLE',
    BOOKING_CONFLICT: 'BOOKING_CONFLICT',
    INVALID_BOOKING_TRANSITION: 'INVALID_BOOKING_TRANSITION',
    BOOKING_ALREADY_CANCELLED: 'BOOKING_ALREADY_CANCELLED',

    // Payment errors
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    REFUND_FAILED: 'REFUND_FAILED',

    // Rate limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

    // Role/Staff errors
    ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
    ROLE_IS_SYSTEM: 'ROLE_IS_SYSTEM',
    ROLE_HAS_USERS: 'ROLE_HAS_USERS',
    STAFF_NOT_FOUND: 'STAFF_NOT_FOUND',
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
    PLAN_LIMIT_REACHED: 'PLAN_LIMIT_REACHED',
    BILLING_REQUIRED: 'BILLING_REQUIRED',
    REFERRAL_PROOF_REQUIRED: 'REFERRAL_PROOF_REQUIRED',

    // Website Builder errors
    THEME_NOT_FOUND: 'THEME_NOT_FOUND',
    PAGE_NOT_FOUND: 'PAGE_NOT_FOUND',
    SECTION_NOT_FOUND: 'SECTION_NOT_FOUND',
    PUBLISH_FAILED: 'PUBLISH_FAILED',
    SLUG_TAKEN: 'SLUG_TAKEN',
    INDUSTRY_NOT_FOUND: 'INDUSTRY_NOT_FOUND',
    FEATURE_NOT_FOUND: 'FEATURE_NOT_FOUND',

    // Server errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export const PUBLISH_STATUSES = ['draft', 'publishing', 'published', 'failed'] as const;

export const DEFAULT_WEBSITE_SETTINGS = {
    tokens: {
        primary: '#ef4444',
        secondary: '#10b981',
        accent: '#f59e0b',
        text: '#1f2937',
        background: '#ffffff',
        font: 'Inter',
    },
    features: {
        booking: true,
        gallery: true,
        testimonials: true,
        contact: true,
    },
    header: {
        menu: [
            { label: 'Home', href: '/' },
            { label: 'About', href: '/about' },
            { label: 'Services', href: '/services' },
            { label: 'Contact', href: '/contact' },
        ],
    },
    footer: {
        columns: [],
        social: [],
    },
    seo: {
        siteName: '',
        defaults: {},
        business: {
            businessType: 'Organization',
            sameAs: [],
        },
    },
} as const;
