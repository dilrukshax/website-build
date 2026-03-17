import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';
import { PlanPolicyService } from '../services/plan-policy.service';

function getTenantIdFromRequest(req: Request): string | null {
    const fromHeader = typeof req.headers['x-tenant-id'] === 'string' ? req.headers['x-tenant-id'] : undefined;
    const fromAuth = req.auth?.tenantId;
    const tenantId = fromHeader || fromAuth;
    return tenantId || null;
}

async function getThemeAccessLimit(req: Request): Promise<number | null> {
    const tenantId = getTenantIdFromRequest(req);
    if (!tenantId) {
        return null;
    }

    if (req.auth?.userId && req.user?.isSuperAdmin !== true) {
        const userTenant = await db.userTenant.findUnique({
            where: {
                userId_tenantId: {
                    userId: req.auth.userId,
                    tenantId,
                },
            },
            select: { status: true },
        });

        if (!userTenant || userTenant.status !== 'active') {
            throw new AppError(ERROR_CODES.FORBIDDEN, 'You do not have access to this tenant catalog view', 403);
        }
    }

    const limits = await PlanPolicyService.getEffectiveLimits(tenantId);
    return limits.maxAccessibleThemes;
}

export class CatalogController {
    // ============================================================
    // Industries
    // ============================================================

    static async listIndustries(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const industries = await db.industry.findMany({
                orderBy: { name: 'asc' },
                include: {
                    _count: { select: { features: true, instances: true } },
                },
            });

            res.json({
                success: true,
                data: industries.map((ind) => ({
                    id: ind.id,
                    name: ind.name,
                    slug: ind.slug,
                    icon: ind.icon,
                    featureCount: ind._count.features,
                    instanceCount: ind._count.instances,
                    createdAt: ind.createdAt,
                })),
            });
        } catch (error) {
            next(error);
        }
    }

    static async createIndustry(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, slug, icon } = req.body;

            const existing = await db.industry.findUnique({ where: { slug } });
            if (existing) {
                throw new AppError(ERROR_CODES.ALREADY_EXISTS, 'Industry with this slug already exists', 409, 'slug');
            }

            const industry = await db.industry.create({
                data: { name, slug, icon: icon || null },
            });

            res.status(201).json({ success: true, data: industry });
        } catch (error) {
            next(error);
        }
    }

    static async updateIndustry(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id!;
            const { name, slug, icon } = req.body;

            const industry = await db.industry.findUnique({ where: { id } });
            if (!industry) {
                throw new AppError(ERROR_CODES.INDUSTRY_NOT_FOUND, 'Industry not found', 404);
            }

            if (slug && slug !== industry.slug) {
                const existing = await db.industry.findUnique({ where: { slug } });
                if (existing) {
                    throw new AppError(ERROR_CODES.ALREADY_EXISTS, 'Industry with this slug already exists', 409, 'slug');
                }
            }

            const updated = await db.industry.update({
                where: { id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(slug !== undefined && { slug }),
                    ...(icon !== undefined && { icon: icon || null }),
                },
            });

            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    static async deleteIndustry(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id!;

            const industry = await db.industry.findUnique({
                where: { id },
                include: { _count: { select: { instances: true } } },
            });
            if (!industry) {
                throw new AppError(ERROR_CODES.INDUSTRY_NOT_FOUND, 'Industry not found', 404);
            }

            if (industry._count.instances > 0) {
                throw new AppError(ERROR_CODES.CONFLICT, 'Cannot delete industry with active instances', 409);
            }

            await db.industry.delete({ where: { id } });
            res.json({ success: true, data: { message: 'Industry deleted' } });
        } catch (error) {
            next(error);
        }
    }

    // ============================================================
    // Features
    // ============================================================

    static async listFeatures(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const features = await db.feature.findMany({
                orderBy: { name: 'asc' },
                include: {
                    _count: { select: { themes: true, industries: true } },
                },
            });

            res.json({
                success: true,
                data: features.map((feat) => ({
                    id: feat.id,
                    name: feat.name,
                    slug: feat.slug,
                    description: feat.description,
                    themeCount: feat._count.themes,
                    industryCount: feat._count.industries,
                    createdAt: feat.createdAt,
                })),
            });
        } catch (error) {
            next(error);
        }
    }

    static async createFeature(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, slug, description } = req.body;

            const existing = await db.feature.findUnique({ where: { slug } });
            if (existing) {
                throw new AppError(ERROR_CODES.ALREADY_EXISTS, 'Feature with this slug already exists', 409, 'slug');
            }

            const feature = await db.feature.create({
                data: { name, slug, description: description || null },
            });

            res.status(201).json({ success: true, data: feature });
        } catch (error) {
            next(error);
        }
    }

    static async updateFeature(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id!;
            const { name, slug, description } = req.body;

            const feature = await db.feature.findUnique({ where: { id } });
            if (!feature) {
                throw new AppError(ERROR_CODES.FEATURE_NOT_FOUND, 'Feature not found', 404);
            }

            if (slug && slug !== feature.slug) {
                const existing = await db.feature.findUnique({ where: { slug } });
                if (existing) {
                    throw new AppError(ERROR_CODES.ALREADY_EXISTS, 'Feature with this slug already exists', 409, 'slug');
                }
            }

            const updated = await db.feature.update({
                where: { id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(slug !== undefined && { slug }),
                    ...(description !== undefined && { description: description || null }),
                },
            });

            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    static async deleteFeature(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id!;

            const feature = await db.feature.findUnique({
                where: { id },
                include: { _count: { select: { themes: true } } },
            });
            if (!feature) {
                throw new AppError(ERROR_CODES.FEATURE_NOT_FOUND, 'Feature not found', 404);
            }

            if (feature._count.themes > 0) {
                throw new AppError(ERROR_CODES.CONFLICT, 'Cannot delete feature with existing themes', 409);
            }

            await db.feature.delete({ where: { id } });
            res.json({ success: true, data: { message: 'Feature deleted' } });
        } catch (error) {
            next(error);
        }
    }

    // ============================================================
    // Industry-Feature assignment
    // ============================================================

    static async assignFeatures(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const industryId = req.params.id!;
            const { featureIds } = req.body as { featureIds: string[] };

            const industry = await db.industry.findUnique({ where: { id: industryId } });
            if (!industry) {
                throw new AppError(ERROR_CODES.INDUSTRY_NOT_FOUND, 'Industry not found', 404);
            }

            // Remove existing mappings and replace
            await db.industryFeature.deleteMany({ where: { industryId } });

            const mappings = featureIds.map((featureId) => ({
                industryId,
                featureId,
            }));

            await db.industryFeature.createMany({ data: mappings });

            res.json({ success: true, data: { message: `Assigned ${featureIds.length} features to industry` } });
        } catch (error) {
            next(error);
        }
    }

    static async getIndustryFeatures(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const industryId = req.params.id!;

            const industry = await db.industry.findUnique({
                where: { id: industryId },
                include: {
                    features: {
                        include: { feature: true },
                    },
                },
            });

            if (!industry) {
                throw new AppError(ERROR_CODES.INDUSTRY_NOT_FOUND, 'Industry not found', 404);
            }

            res.json({
                success: true,
                data: industry.features.map((if_) => if_.feature),
            });
        } catch (error) {
            next(error);
        }
    }

    // ============================================================
    // Themes
    // ============================================================

    static async listThemes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { featureId } = req.query;
            const includePremiumPreview = req.query.includePremiumPreview === 'true';
            const maxAccessibleThemes = await getThemeAccessLimit(req);

            const themes = await db.theme.findMany({
                where: {
                    ...(featureId && { featureId: featureId as string }),
                    isActive: true,
                    ...(!includePremiumPreview && maxAccessibleThemes !== null && { accessRank: { lte: maxAccessibleThemes } }),
                },
                orderBy: [{ accessRank: 'asc' }, { slug: 'asc' }, { version: 'desc' }],
                include: {
                    feature: { select: { id: true, name: true, slug: true } },
                },
            });

            res.json({
                success: true,
                data: themes.map((theme) => ({
                    ...theme,
                    isPlanRestricted: maxAccessibleThemes !== null && theme.accessRank > maxAccessibleThemes,
                })),
            });
        } catch (error) {
            next(error);
        }
    }

    static async getThemeById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id!;

            const theme = await db.theme.findUnique({
                where: { id },
                include: {
                    feature: { select: { id: true, name: true, slug: true } },
                },
            });

            if (!theme) {
                throw new AppError(ERROR_CODES.THEME_NOT_FOUND, 'Theme not found', 404);
            }

            res.json({ success: true, data: theme });
        } catch (error) {
            next(error);
        }
    }

    static async createTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {
                featureId,
                name,
                slug,
                version,
                componentKey,
                accessRank,
                schemaJsonb,
                defaultStylesJsonb,
                previewImageUrl,
            } = req.body;

            // Verify feature exists
            const feature = await db.feature.findUnique({ where: { id: featureId } });
            if (!feature) {
                throw new AppError(ERROR_CODES.FEATURE_NOT_FOUND, 'Feature not found', 404, 'featureId');
            }

            // Check slug+version uniqueness
            const existing = await db.theme.findUnique({
                where: { slug_version: { slug, version: version || 1 } },
            });
            if (existing) {
                throw new AppError(ERROR_CODES.ALREADY_EXISTS, 'Theme with this slug and version already exists', 409);
            }

            const theme = await db.theme.create({
                data: {
                    featureId,
                    name,
                    slug,
                    version: version || 1,
                    componentKey,
                    accessRank: accessRank || 100,
                    schemaJsonb,
                    defaultStylesJsonb,
                    previewImageUrl: previewImageUrl || null,
                },
            });

            res.status(201).json({ success: true, data: theme });
        } catch (error) {
            next(error);
        }
    }

    static async updateTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id!;
            const { name, componentKey, accessRank, schemaJsonb, defaultStylesJsonb, previewImageUrl, isActive } = req.body;

            const theme = await db.theme.findUnique({ where: { id } });
            if (!theme) {
                throw new AppError(ERROR_CODES.THEME_NOT_FOUND, 'Theme not found', 404);
            }

            const updated = await db.theme.update({
                where: { id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(componentKey !== undefined && { componentKey }),
                    ...(accessRank !== undefined && { accessRank }),
                    ...(schemaJsonb !== undefined && { schemaJsonb }),
                    ...(defaultStylesJsonb !== undefined && { defaultStylesJsonb }),
                    ...(previewImageUrl !== undefined && { previewImageUrl }),
                    ...(isActive !== undefined && { isActive }),
                },
            });

            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    static async deleteTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id!;

            const theme = await db.theme.findUnique({ where: { id } });
            if (!theme) {
                throw new AppError(ERROR_CODES.THEME_NOT_FOUND, 'Theme not found', 404);
            }

            // Soft delete — deactivate
            await db.theme.update({ where: { id }, data: { isActive: false } });
            res.json({ success: true, data: { message: 'Theme deactivated' } });
        } catch (error) {
            next(error);
        }
    }

    // ============================================================
    // Get themes available for an industry
    // ============================================================

    static async getIndustryThemes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const industryId = req.params.id!;
            const maxAccessibleThemes = await getThemeAccessLimit(req);

            const industry = await db.industry.findUnique({ where: { id: industryId } });
            if (!industry) {
                throw new AppError(ERROR_CODES.INDUSTRY_NOT_FOUND, 'Industry not found', 404);
            }

            // Get all features for this industry, then all active themes for those features
            const industryFeatures = await db.industryFeature.findMany({
                where: { industryId },
                include: {
                    feature: {
                        include: {
                            themes: {
                                where: {
                                    isActive: true,
                                    ...(maxAccessibleThemes !== null && { accessRank: { lte: maxAccessibleThemes } }),
                                },
                                orderBy: [{ accessRank: 'asc' }, { version: 'desc' }],
                            },
                        },
                    },
                },
            });

            const result = industryFeatures.map((if_) => ({
                feature: {
                    id: if_.feature.id,
                    name: if_.feature.name,
                    slug: if_.feature.slug,
                },
                themes: if_.feature.themes,
            }));

            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}
