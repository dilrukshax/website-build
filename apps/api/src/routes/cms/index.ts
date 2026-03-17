import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import { requireInstance } from '../../middleware/instance';
import { requireSuperAdmin } from '../../middleware/superadmin';
import { validate } from '../../middleware/validate';
import { TenantsController } from '../../controllers/tenants.controller';
import { InstancesController } from '../../controllers/instances.controller';
import { CustomersController } from '../../controllers/customers.controller';
import { ServicesController } from '../../controllers/services.controller';
import { BookingsController } from '../../controllers/bookings.controller';
import { InquiriesController } from '../../controllers/inquiries.controller';
import { FeedbackController } from '../../controllers/feedback.controller';
import { RolesController } from '../../controllers/roles.controller';
import { StaffController } from '../../controllers/staff.controller';
import { PermissionsController } from '../../controllers/permissions.controller';
import { createCustomerSchema, updateCustomerSchema } from '../../validators/customers.validators';
import { createServiceSchema, reorderServicesSchema, updateServiceSchema } from '../../validators/services.validators';
import { createBookingSchema, cancelBookingSchema } from '../../validators/bookings.validators';
import { updateInquiryStatusSchema } from '../../validators/inquiries.validators';
import { createFeedbackRatingSchema, createFeedbackSuggestionSchema } from '../../validators/feedback.validators';
import {
    createInstanceSchema,
    updateInstanceSchema,
    upsertDomainRouteSchema,
} from '../../validators/instances.validators';
import { createTenantSchema, updateTenantSchema } from '../../validators/tenants.validators';
import { createRoleSchema, updateRoleSchema } from '../../validators/roles.validators';
import { createStaffSchema, updateStaffSchema } from '../../validators/staff.validators';
import { createPageSchema, updatePageSchema, reorderPagesSchema } from '../../validators/pages.validators';
import { createSectionSchema, updateSectionSchema, reorderSectionsSchema } from '../../validators/sections.validators';
import { updateWebsiteSettingsSchema } from '../../validators/builder.validators';
import { PagesController } from '../../controllers/pages.controller';
import { SectionsController } from '../../controllers/sections.controller';
import { BuilderController } from '../../controllers/builder.controller';
import { FeatureTogglesController } from '../../controllers/feature-toggles.controller';
import { upsertFeatureToggleSchema, bulkUpdateFeatureTogglesSchema } from '../../validators/feature-toggles.validators';
import { presignUploadSchema, completeUploadSchema } from '../../validators/media.validators';
import { MediaController } from '../../controllers/media.controller';
import { superAdminRouter } from './superadmin.routes';
import { catalogRouter } from './catalog.routes';
import { referralsRouter } from '../referrals';
import { BillingController } from '../../controllers/billing.controller';
import { SuperAdminBillingController } from '../../controllers/superadmin-billing.controller';
import { SuperAdminReferralsController } from '../../controllers/superadmin-referrals.controller';
import { SuperAdminController } from '../../controllers/superadmin.controller';
import {
    addonPurchaseSchema,
    listChargesQuerySchema,
    planChangeSchema,
    redeemPointsSchema,
    rejectChargeSchema,
} from '../../validators/billing.validators';
import {
    approveClaimSchema,
    approveEnterpriseRewardSchema,
    blockClaimSchema,
    listClaimsQuerySchema,
    rejectEnterpriseRewardSchema,
} from '../../validators/superadmin-referrals.validators';
import { RoutingIndexController } from '../../controllers/routing-index.controller';

const router = Router();

// All CMS routes require authentication
router.use(requireAuth);

// =============================================================
// Tenant management (no tenant context required — auth only)
// =============================================================
router.get('/tenants', TenantsController.list);
router.post('/tenants', validate(createTenantSchema), TenantsController.create);
router.get('/tenants/:id', TenantsController.getById);
router.put('/tenants/:id', validate(updateTenantSchema), TenantsController.update);
router.delete('/tenants/:id', TenantsController.deactivate);

// Super Admin Routes
router.use('/superadmin/tenants', superAdminRouter);
router.get('/superadmin/dashboard', requireSuperAdmin, SuperAdminController.dashboardSummary);
router.post('/superadmin/routing-index/rebuild', requireSuperAdmin, RoutingIndexController.rebuild);
router.get('/superadmin/feedback', requireSuperAdmin, FeedbackController.listSuperAdmin);
router.get('/superadmin/billing/charges', requireSuperAdmin, validate(listChargesQuerySchema, 'query'), SuperAdminBillingController.listCharges);
router.post('/superadmin/billing/charges/:id/confirm', requireSuperAdmin, SuperAdminBillingController.confirmCharge);
router.post('/superadmin/billing/charges/:id/reject', requireSuperAdmin, validate(rejectChargeSchema), SuperAdminBillingController.rejectCharge);
router.get('/superadmin/referrals/claims', requireSuperAdmin, validate(listClaimsQuerySchema, 'query'), SuperAdminReferralsController.listClaims);
router.post('/superadmin/referrals/claims/:id/approve', requireSuperAdmin, validate(approveClaimSchema), SuperAdminReferralsController.approveClaim);
router.post('/superadmin/referrals/claims/:id/block', requireSuperAdmin, validate(blockClaimSchema), SuperAdminReferralsController.blockClaim);
router.post('/superadmin/referrals/enterprise/:claimId/approve', requireSuperAdmin, validate(approveEnterpriseRewardSchema), SuperAdminReferralsController.approveEnterpriseReward);
router.post('/superadmin/referrals/enterprise/:claimId/reject', requireSuperAdmin, validate(rejectEnterpriseRewardSchema), SuperAdminReferralsController.rejectEnterpriseReward);

// Catalog Routes (read: all authenticated, write: superAdmin)
router.use('/catalog', catalogRouter);

// Referral management routes (user-scoped, no tenant context required)
router.use('/referrals', referralsRouter);

// =============================================================
// Tenant-scoped routes (require tenant context)
// =============================================================
const tenantRouter: ExpressRouter = Router();
tenantRouter.use(requireTenant);

// --- Instance management (tenant-scoped) ---
tenantRouter.get('/instances', InstancesController.list);
tenantRouter.post('/instances', validate(createInstanceSchema), InstancesController.create);
tenantRouter.get('/instances/:id', InstancesController.getById);
tenantRouter.put('/instances/:id', validate(updateInstanceSchema), InstancesController.update);
tenantRouter.delete('/instances/:id', InstancesController.deactivate);

// Domain routing (provider-agnostic)
tenantRouter.put('/instances/:id/domain-route', validate(upsertDomainRouteSchema), InstancesController.upsertDomainRoute);
tenantRouter.post('/instances/:id/domain-route', validate(upsertDomainRouteSchema), InstancesController.upsertDomainRoute);
tenantRouter.delete('/instances/:id/domain-route/:host', InstancesController.removeDomainRoute);
// Legacy alias kept for older clients during rollout.
tenantRouter.put('/instances/:id/custom-domain', validate(upsertDomainRouteSchema), InstancesController.upsertDomainRoute);
tenantRouter.delete('/instances/:id/custom-domain/:host', InstancesController.removeDomainRoute);
tenantRouter.post('/instances/:id/custom-domain', InstancesController.updateCustomDomainLegacy);
tenantRouter.get('/instances/:id/custom-domain/status', InstancesController.getCustomDomainStatusLegacy);
tenantRouter.get('/instances/:id/custom-domain/setup', InstancesController.getCustomDomainSetupLegacy);
tenantRouter.delete('/instances/:id/custom-domain', InstancesController.removeCustomDomainLegacy);

// --- Billing (tenant-scoped) ---
tenantRouter.get('/billing/summary', BillingController.summary);
tenantRouter.get('/billing/usage', BillingController.usage);
tenantRouter.post('/billing/plan-change', validate(planChangeSchema), BillingController.requestPlanChange);
tenantRouter.post('/billing/addons', validate(addonPurchaseSchema), BillingController.requestAddons);
tenantRouter.post('/billing/redeem-points', validate(redeemPointsSchema), BillingController.redeemPoints);

// --- Roles (tenant-scoped) ---
tenantRouter.get('/roles', requirePermission('roles.view'), RolesController.list);
tenantRouter.post('/roles', requirePermission('roles.create'), validate(createRoleSchema), RolesController.create);
tenantRouter.get('/roles/:id', requirePermission('roles.view'), RolesController.getById);
tenantRouter.put('/roles/:id', requirePermission('roles.update'), validate(updateRoleSchema), RolesController.update);
tenantRouter.delete('/roles/:id', requirePermission('roles.delete'), RolesController.delete);

// --- Permissions (tenant-scoped) ---
tenantRouter.get('/permissions', requirePermission('roles.view'), PermissionsController.list);

// --- Staff (tenant-scoped) ---
tenantRouter.get('/staff', requirePermission('staff.view'), StaffController.list);
tenantRouter.post('/staff', requirePermission('staff.create'), validate(createStaffSchema), StaffController.create);
tenantRouter.get('/staff/:id', requirePermission('staff.view'), StaffController.getById);
tenantRouter.put('/staff/:id', requirePermission('staff.update'), validate(updateStaffSchema), StaffController.update);
tenantRouter.delete('/staff/:id', requirePermission('staff.delete'), StaffController.remove);

// --- Feedback (tenant-scoped) ---
tenantRouter.get('/feedback/ratings', FeedbackController.listRatings);
tenantRouter.post('/feedback/ratings', validate(createFeedbackRatingSchema), FeedbackController.createRating);
tenantRouter.get('/feedback/suggestions', FeedbackController.listSuggestions);
tenantRouter.post('/feedback/suggestions', validate(createFeedbackSuggestionSchema), FeedbackController.createSuggestion);

// =============================================================
// Instance-scoped routes (require tenant + instance context)
// =============================================================
const instanceRouter: ExpressRouter = Router();
instanceRouter.use(requireInstance);

// --- Customers (instance-scoped) ---
instanceRouter.get('/customers', requirePermission('customers.view'), CustomersController.list);
instanceRouter.post('/customers', requirePermission('customers.create'), validate(createCustomerSchema), CustomersController.create);
instanceRouter.post('/customers/search', requirePermission('customers.search'), CustomersController.search);
instanceRouter.get('/customers/:id', requirePermission('customers.view'), CustomersController.getById);
instanceRouter.put('/customers/:id', requirePermission('customers.update'), validate(updateCustomerSchema), CustomersController.update);
instanceRouter.delete('/customers/:id', requirePermission('customers.delete'), CustomersController.delete);

// --- Services (instance-scoped) ---
instanceRouter.get('/services', requirePermission('services.view'), ServicesController.listCms);
instanceRouter.post('/services', requirePermission('services.create'), validate(createServiceSchema), ServicesController.create);
instanceRouter.put('/services/reorder', requirePermission('services.update'), validate(reorderServicesSchema), ServicesController.reorder);
instanceRouter.get('/services/:id', requirePermission('services.view'), ServicesController.getById);
instanceRouter.put('/services/:id', requirePermission('services.update'), validate(updateServiceSchema), ServicesController.update);
instanceRouter.delete('/services/:id', requirePermission('services.delete'), ServicesController.delete);

// --- Bookings (instance-scoped) ---
instanceRouter.get('/bookings', requirePermission('bookings.view'), BookingsController.list);
instanceRouter.post('/bookings/calendar', requirePermission('bookings.view'), BookingsController.calendar);
instanceRouter.get('/bookings/stats', requirePermission('bookings.view'), BookingsController.getStats);
instanceRouter.post('/bookings', requirePermission('bookings.create'), validate(createBookingSchema), BookingsController.create);
instanceRouter.get('/bookings/:id', requirePermission('bookings.view'), BookingsController.getById);
instanceRouter.post('/bookings/:id/confirm', requirePermission('bookings.confirm'), BookingsController.confirm);
instanceRouter.post('/bookings/:id/complete', requirePermission('bookings.complete'), BookingsController.complete);
instanceRouter.delete('/bookings/:id', requirePermission('bookings.delete'), validate(cancelBookingSchema), BookingsController.cancel);

// --- Inquiries (instance-scoped) ---
instanceRouter.get('/inquiries', requirePermission('inquiries.view'), InquiriesController.list);
instanceRouter.get('/inquiries/:id', requirePermission('inquiries.view'), InquiriesController.getById);
instanceRouter.put('/inquiries/:id', requirePermission('inquiries.update'), InquiriesController.update);
instanceRouter.put('/inquiries/:id/status', requirePermission('inquiries.update_status'), validate(updateInquiryStatusSchema), InquiriesController.updateStatus);
instanceRouter.delete('/inquiries/:id', requirePermission('inquiries.delete'), InquiriesController.delete);

// --- Pages (instance-scoped, website builder) ---
instanceRouter.get('/pages', requirePermission('website.view'), PagesController.list);
instanceRouter.post('/pages', requirePermission('website.edit'), validate(createPageSchema), PagesController.create);
instanceRouter.put('/pages/reorder', requirePermission('website.edit'), validate(reorderPagesSchema), PagesController.reorder);
instanceRouter.get('/pages/:id', requirePermission('website.view'), PagesController.getById);
instanceRouter.put('/pages/:id', requirePermission('website.edit'), validate(updatePageSchema), PagesController.update);
instanceRouter.delete('/pages/:id', requirePermission('website.edit'), PagesController.delete);
instanceRouter.post('/pages/:id/apply-template', requirePermission('website.edit'), PagesController.applyTemplate);

// --- Page Sections (instance-scoped, website builder) ---
instanceRouter.get('/pages/:pageId/sections', requirePermission('website.view'), SectionsController.listByPage);
instanceRouter.post('/pages/:pageId/sections', requirePermission('website.edit'), validate(createSectionSchema), SectionsController.create);
instanceRouter.put('/pages/:pageId/sections/reorder', requirePermission('website.edit'), validate(reorderSectionsSchema), SectionsController.reorder);
instanceRouter.put('/sections/:id', requirePermission('website.edit'), validate(updateSectionSchema), SectionsController.update);
instanceRouter.delete('/sections/:id', requirePermission('website.edit'), SectionsController.delete);

// --- Feature Toggles (instance-scoped) ---
instanceRouter.get('/feature-toggles', requirePermission('website.settings'), FeatureTogglesController.list);
instanceRouter.put('/feature-toggles', requirePermission('website.settings'), validate(upsertFeatureToggleSchema), FeatureTogglesController.upsert);
instanceRouter.put('/feature-toggles/bulk', requirePermission('website.settings'), validate(bulkUpdateFeatureTogglesSchema), FeatureTogglesController.bulkUpdate);
instanceRouter.delete('/feature-toggles/:id', requirePermission('website.settings'), FeatureTogglesController.delete);

// --- Media Uploads (instance-scoped) ---
instanceRouter.post('/uploads/presign', requirePermission('website.edit'), validate(presignUploadSchema), MediaController.presign);
instanceRouter.post('/uploads/complete', requirePermission('website.edit'), validate(completeUploadSchema), MediaController.complete);

// --- Builder (instance-scoped, website builder) ---
instanceRouter.get('/builder/pages/:pageId', requirePermission('website.view'), BuilderController.getPageManifest);
instanceRouter.get('/builder/settings', requirePermission('website.settings'), BuilderController.getSettings);
instanceRouter.put('/builder/settings', requirePermission('website.settings'), validate(updateWebsiteSettingsSchema), BuilderController.updateSettings);
instanceRouter.get('/builder/publish-readiness', requirePermission('website.view'), BuilderController.publishReadiness);
instanceRouter.post('/builder/publish', requirePermission('website.publish'), BuilderController.publish);
instanceRouter.post('/builder/purge-cache', requirePermission('website.publish'), BuilderController.purgeCache);
instanceRouter.get('/builder/publish/history', requirePermission('website.view'), BuilderController.publishHistory);
instanceRouter.post('/builder/rollback', requirePermission('website.publish'), BuilderController.rollback);

// Mount instance-scoped routes under tenant router
tenantRouter.use('/', instanceRouter);

// Mount tenant router under main CMS router (MUST be last)
router.use('/', tenantRouter);

export const cmsRouter: ExpressRouter = router;
