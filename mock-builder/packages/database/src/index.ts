// Re-export Prisma client and tenant utilities
export { db, setTenantContext, tenantContext } from './client';

// Re-export seed utility
export { seedDefaultRoles } from './seed-roles';

// Re-export generated Prisma types for convenience
export type {
    Tenant,
    Instance,
    User,
    UserTenant,
    Role,
    Permission,
    RolePermission,
    PasswordResetToken,
    RefreshToken,
    Customer,
    Service,
    Booking,
    Inquiry,
    FeatureToggle,
    Industry,
    Feature,
    IndustryFeature,
    Theme,
    Page,
    PageSection,
    PublishRecord,
    TenantStatus,
    InstanceStatus,
    UserStatus,
    UserTenantStatus,
    BookingStatus,
    InquiryStatus,
    PublishStatus,
    Prisma,
} from '@prisma/client';
