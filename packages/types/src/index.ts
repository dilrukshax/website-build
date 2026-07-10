// ============================================================
// Shared TypeScript types for the Project Aurora platform
// Used across: apps/website-builder-api, apps/website-builder-web, apps/themes/*
// ============================================================

// --- API Response shapes ---

export interface ApiSuccess<T> {
    success: true;
    data: T;
    meta?: PaginationMeta;
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        field?: string;
        details?: unknown;
    };
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// --- Tenant ---

export type TenantStatus = 'active' | 'inactive' | 'suspended';

export interface Tenant {
    id: string;
    subdomain: string;
    customDomain: string | null;
    businessName: string;
    status: TenantStatus;
    plan: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TenantContext {
    id: string;
    subdomain: string;
    businessName: string;
    status: TenantStatus;
}

// --- Tenant User ---

export type UserRole = 'owner' | 'admin' | 'staff';

export interface TenantUser {
    id: string;
    tenantId: string;
    clerkUserId: string;
    role: UserRole;
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthContext {
    userId: string;
    tenantId: string;
    role: UserRole;
    permissions: string[];
}

// --- Customer ---

export interface Customer {
    id: string;
    tenantId: string;
    instanceId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    notes: string | null;
    bookingCount?: number;
    inquiryCount?: number;
    lastInquiryAt?: Date | string | null;
    lastInquirySourcePageSlug?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// --- Service ---

export interface Service {
    id: string;
    tenantId: string;
    name: string;
    description: string | null;
    duration: number; // minutes
    price: number;
    currency: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// --- Booking ---

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Booking {
    id: string;
    tenantId: string;
    customerId: string;
    serviceId: string;
    startTime: Date;
    endTime: Date;
    status: BookingStatus;
    notes: string | null;
    totalPrice: number;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
}

// --- Inquiry ---

export type InquiryStatus = 'new' | 'in_progress' | 'resolved' | 'spam';
export type InquirySourceType = 'contact_form' | 'booking_form';

export interface Inquiry {
    id: string;
    tenantId: string;
    instanceId?: string;
    customerId: string | null;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    status: InquiryStatus;
    sourceType?: InquirySourceType | null;
    sourcePageSlug?: string | null;
    customer?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
    } | null;
    createdAt: Date;
    updatedAt: Date;
}

// --- Feature Toggles ---

export type EngineToggleKey =
    | 'engine_appointments_enabled'
    | 'engine_tours_enabled'
    | 'engine_ondemand_enabled'
    | 'engine_courses_enabled'
    | 'engine_events_enabled'
    | 'engine_subscriptions_enabled';

export interface FeatureToggle {
    id: string;
    tenantId: string;
    toggleKey: string;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
