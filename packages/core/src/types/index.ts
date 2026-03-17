// ============================================================
// Entity Types - Core data models matching database schema
// ============================================================

export interface Tenant {
  id: string;
  businessName: string;
  status: TenantStatus;
  planTier: PlanTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface Instance {
  id: string;
  tenantId: string;
  subdomain: string;
  fullDomain: string | null;
  customDomain: string | null;
  name: string;
  businessType: string | null;
  industryId: string | null;
  settingsJsonb: WebsiteSettings | null;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export type TenantStatus = "active" | "inactive" | "suspended" | "pending";
export type PlanTier = "free" | "starter" | "freelance" | "enterprise";

export type UserRole = "owner" | "admin" | "staff" | "readonly";

export interface Customer {
  id: string;
  tenantId: string;
  email: string;
  phone: string | null;
  fullName: string;
  address: CustomerAddress | null;
  notes: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  category: string | null;
  durationMinutes: number | null;
  price: number | null;
  currency: string;
  capacity: number;
  bufferTimeMinutes: number;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  tenantId: string;
  customerId: string;
  serviceId: string | null;
  bookingNumber: string;
  status: BookingStatus;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  participants: number;
  price: number | null;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  notes: string | null;
  internalNotes: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  cancellationReason: string | null;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";

export interface Inquiry {
  id: string;
  tenantId: string;
  customerId: string | null;
  serviceId: string | null;
  type: InquiryType;
  status: InquiryStatus;
  subject: string | null;
  message: string;
  contactEmail: string;
  contactPhone: string | null;
  preferredDate: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type InquiryType = "general" | "quote" | "booking_request";
export type InquiryStatus = "new" | "in_progress" | "converted" | "closed";

export interface Feedback {
  id: string;
  tenantId: string;
  type: FeedbackType;
  score: number | null;
  note: string | null;
  title: string | null;
  message: string | null;
  submittedByUserId: string;
  submittedByEmail: string;
  submittedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export type FeedbackType = "rating" | "suggestion";

export interface AvailabilityRule {
  id: string;
  tenantId: string;
  serviceId: string | null;
  ruleType: "recurring" | "specific_date" | "blackout";
  dayOfWeek: number | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  isAvailable: boolean;
  capacity: number | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface Payment {
  id: string;
  tenantId: string;
  bookingId: string | null;
  customerId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: string | null;
  transactionId: string | null;
  gateway: string | null;
  gatewayResponse: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  processedAt: Date | null;
}

export interface ThemeConfiguration {
  id: string;
  tenantId: string;
  themeId: string;
  enabledFeatures: string[];
  customSettings: Record<string, unknown>;
  colors: ThemeColors | null;
  fonts: ThemeFonts | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
}

export interface SEOSettings {
  id: string;
  tenantId: string;
  pageType: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  structuredData: Record<string, unknown> | null;
  customHeadTags: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  tenantId: string | null;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// ============================================================
// API Types - Request/Response formats
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  errors?: ApiError[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============================================================
// Auth Types
// ============================================================

export interface JWTPayload {
  userId: string;
  email: string;
  tenantId?: string;
  role?: string;
  isSuperAdmin?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface SwitchTenantRequest {
  tenantId: string;
}

export interface CreateTenantRequest {
  businessName: string;
}

export interface CreateInstanceRequest {
  name: string;
  subdomain: string;
  businessType?: string;
}

export interface CreateStaffRequest {
  email: string;
  password: string;
  fullName: string;
  roleId: string;
}

export interface UpdateStaffRequest {
  roleId?: string;
  status?: 'active' | 'inactive';
  fullName?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

// ============================================================
// Website Builder Types
// ============================================================

export interface Industry {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  createdAt: Date;
}

export interface Feature {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
}

export interface Theme {
  id: string;
  featureId: string;
  name: string;
  slug: string;
  version: number;
  componentKey: string;
  schemaJsonb: ThemeSchema;
  defaultStylesJsonb: Record<string, unknown>;
  previewImageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThemeSchema {
  type: 'object';
  properties: Record<string, ThemeSchemaProperty>;
  required?: string[];
}

export interface ThemeSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  title?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  items?: ThemeSchemaProperty;
  properties?: Record<string, ThemeSchemaProperty>;
  required?: string[];
}

export interface Page {
  id: string;
  tenantId: string;
  instanceId: string;
  slug: string;
  title: string;
  seoJsonb: SEOData | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SEOData {
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
}

export interface PageSection {
  id: string;
  tenantId: string;
  instanceId: string;
  pageId: string;
  themeId: string;
  themeVersionUsed: number;
  position: number;
  enabled: boolean;
  contentJsonb: Record<string, unknown>;
  stylesJsonb: Record<string, unknown>;
  conditionsJsonb: SDUICondition[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SDUICondition {
  op: 'equals' | 'notEquals' | 'exists' | 'notExists' | 'gt' | 'lt';
  path: string;
  value?: unknown;
}

export type PublishStatus = 'draft' | 'publishing' | 'published' | 'failed';

export interface PublishRecord {
  id: string;
  tenantId: string;
  instanceId: string;
  version: number;
  status: PublishStatus;
  publishedAt: Date | null;
  publishedBy: string;
  artifactUrl: string | null;
  manifestJsonb: SDUIManifest | null;
  createdAt: Date;
}

// ============================================================
// Website Settings (stored in Instance.settingsJsonb)
// ============================================================

export interface WebsiteSettings {
  tokens: WebsiteTokens;
  features: Record<string, boolean>;
  header: WebsiteHeaderSettings;
  footer: WebsiteFooterSettings;
}

export interface WebsiteTokens {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  font: string;
}

export interface WebsiteHeaderSettings {
  logoUrl?: string;
  logoAlt?: string;
  menu: Array<{ label: string; href: string }>;
}

export interface WebsiteFooterSettings {
  copyrightText?: string;
  columns: Array<{
    title: string;
    links: Array<{ label: string; href: string }>;
  }>;
  social: Array<{ platform: string; url: string }>;
}

// ============================================================
// SDUI Manifest Types
// ============================================================

export interface SDUIManifest {
  instanceId: string;
  page: {
    id: string;
    slug: string;
    title: string;
  };
  tokens: WebsiteTokens;
  features: Record<string, boolean>;
  sections: SDUISection[];
}

export interface SDUISection {
  id: string;
  type: string;
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
  conditions: SDUICondition[];
  position: number;
}

// ============================================================
// Builder Request Types
// ============================================================

export interface CreatePageRequest {
  title: string;
  slug: string;
  seoJsonb?: SEOData;
}

export interface UpdatePageRequest {
  title?: string;
  slug?: string;
  seoJsonb?: SEOData;
  isPublished?: boolean;
}

export interface CreateSectionRequest {
  themeId: string;
  position?: number;
  contentJsonb?: Record<string, unknown>;
  stylesJsonb?: Record<string, unknown>;
}

export interface UpdateSectionRequest {
  contentJsonb?: Record<string, unknown>;
  stylesJsonb?: Record<string, unknown>;
  enabled?: boolean;
  conditionsJsonb?: SDUICondition[];
}

export interface ReorderSectionsRequest {
  sections: Array<{ id: string; position: number }>;
}

export interface UpdateWebsiteSettingsRequest {
  tokens?: Partial<WebsiteTokens>;
  features?: Record<string, boolean>;
  header?: Partial<WebsiteHeaderSettings>;
  footer?: Partial<WebsiteFooterSettings>;
}
