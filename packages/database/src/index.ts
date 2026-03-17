// Re-export Prisma client and tenant utilities
export { db, setTenantContext, tenantContext, runWithoutTenantContext } from './client';

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
    Feedback,
    FeatureToggle,
    MediaAsset,
    Industry,
    Feature,
    IndustryFeature,
    Theme,
    Page,
    PageSection,
    PublishRecord,
    DeviceFingerprint,
    AccountDevice,
    ReferralProfile,
    ReferralClaim,
    ReferralFraudLog,
    TenantStatus,
    InstanceStatus,
    UserStatus,
    UserTenantStatus,
    BookingStatus,
    InquiryStatus,
    FeedbackType,
    MediaUploadStatus,
    PublishStatus,
    ReferralAction,
    ReferralClaimStatus,
    Prisma,
} from '@prisma/client';
