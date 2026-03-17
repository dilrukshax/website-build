import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { requireSuperAdmin } from '../../middleware/superadmin';
import { validate } from '../../middleware/validate';
import { CatalogController } from '../../controllers/catalog.controller';
import {
    createIndustrySchema,
    updateIndustrySchema,
    createFeatureSchema,
    updateFeatureSchema,
    assignFeaturesSchema,
    createThemeSchema,
    updateThemeSchema,
} from '../../validators/catalog.validators';

const router: ExpressRouter = Router();

// ============================================================
// Read-only routes (available to all authenticated users)
// ============================================================

router.get('/industries', CatalogController.listIndustries);
router.get('/industries/:id/features', CatalogController.getIndustryFeatures);
router.get('/industries/:id/themes', CatalogController.getIndustryThemes);
router.get('/features', CatalogController.listFeatures);
router.get('/themes', CatalogController.listThemes);
router.get('/themes/:id', CatalogController.getThemeById);

import { PageTemplatesController } from '../../controllers/page-templates.controller';
router.get('/page-templates', PageTemplatesController.list);


// ============================================================
// Write routes (superAdmin only)
// ============================================================

router.post('/industries', requireSuperAdmin, validate(createIndustrySchema), CatalogController.createIndustry);
router.put('/industries/:id', requireSuperAdmin, validate(updateIndustrySchema), CatalogController.updateIndustry);
router.delete('/industries/:id', requireSuperAdmin, CatalogController.deleteIndustry);

router.post('/features', requireSuperAdmin, validate(createFeatureSchema), CatalogController.createFeature);
router.put('/features/:id', requireSuperAdmin, validate(updateFeatureSchema), CatalogController.updateFeature);
router.delete('/features/:id', requireSuperAdmin, CatalogController.deleteFeature);

router.post('/industries/:id/features', requireSuperAdmin, validate(assignFeaturesSchema), CatalogController.assignFeatures);

router.post('/themes', requireSuperAdmin, validate(createThemeSchema), CatalogController.createTheme);
router.put('/themes/:id', requireSuperAdmin, validate(updateThemeSchema), CatalogController.updateTheme);
router.delete('/themes/:id', requireSuperAdmin, CatalogController.deleteTheme);

export const catalogRouter: ExpressRouter = router;
