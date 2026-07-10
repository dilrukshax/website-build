import { Request, Response, NextFunction } from 'express';
import { db } from '@project-aurora/database';
import { ERROR_CODES, DEFAULT_WEBSITE_SETTINGS, logger } from '@project-aurora/core';
import type { SDUIManifest, SDUISection, SEOData, WebsiteSEOBusiness, WebsiteSettings } from '@project-aurora/core';
import { AppError } from '../middleware/error';
import { S3Service } from '../services/s3.service';
import { invalidatePublishedSiteCache } from '../services/publish-cache-invalidation.service';
import { PlanPolicyService } from '../services/plan-policy.service';
import { buildPrimaryFullDomain } from '../utils/domain';
import { RoutingIndexService } from '../services/routing-index.service';

function normalizeSeoData(raw: unknown): SEOData | null {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return null;
    }

    return raw as SEOData;
}

function normalizeSeoBusiness(raw: unknown): WebsiteSEOBusiness | null {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return null;
    }

    return raw as WebsiteSEOBusiness;
}

interface PublishReadinessTheme {
    id: string;
    name: string;
    componentKey: string;
    accessRank: number;
}

interface PublishReadinessResult {
    canPublish: boolean;
    message: string | null;
    maxAccessibleThemes: number | null;
    blockedThemes: PublishReadinessTheme[];
}

async function getPublishReadinessForInstance(tenantId: string, instanceId: string): Promise<PublishReadinessResult> {
    const limits = await PlanPolicyService.getEffectiveLimits(tenantId);
    const maxAccessibleThemes = limits.maxAccessibleThemes;

    if (maxAccessibleThemes === null) {
        return {
            canPublish: true,
            message: null,
            maxAccessibleThemes,
            blockedThemes: [],
        };
    }

    const sections = await db.pageSection.findMany({
        where: { tenantId, instanceId, enabled: true },
        select: {
            theme: {
                select: {
                    id: true,
                    name: true,
                    componentKey: true,
                    accessRank: true,
                },
            },
        },
    });

    const blockedThemeMap = new Map<string, PublishReadinessTheme>();
    for (const section of sections) {
        if (section.theme.accessRank > maxAccessibleThemes) {
            blockedThemeMap.set(section.theme.id, section.theme);
        }
    }

    const blockedThemes = Array.from(blockedThemeMap.values()).sort((a, b) =>
        a.accessRank === b.accessRank
            ? a.name.localeCompare(b.name)
            : a.accessRank - b.accessRank
    );

    if (blockedThemes.length === 0) {
        return {
            canPublish: true,
            message: null,
            maxAccessibleThemes,
            blockedThemes: [],
        };
    }

    const blockedThemeNames = blockedThemes.map((theme) => theme.name).join(', ');
    const message = limits.plan === 'free'
        ? `This website uses sections outside your current theme access (${blockedThemeNames}).`
        : `This website uses themes outside your current plan (${blockedThemeNames}). Upgrade your plan to publish.`;

    return {
        canPublish: false,
        message,
        maxAccessibleThemes,
        blockedThemes,
    };
}

export class BuilderController {
    /**
     * Get SDUI manifest for a page (draft mode).
     * Assembles tokens + features + ordered sections into a render-ready manifest.
     */
    static async getPageManifest(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const pageId = req.params.pageId!;

            // Load instance settings
            const instance = await db.instance.findUnique({ where: { id: instanceId } });
            if (!instance) {
                throw new AppError(ERROR_CODES.INSTANCE_NOT_FOUND, 'Instance not found', 404);
            }

            // Load page with sections
            const page = await db.page.findFirst({
                where: { id: pageId, instanceId },
                include: {
                    sections: {
                        where: { enabled: true },
                        orderBy: { position: 'asc' },
                        include: {
                            theme: {
                                select: {
                                    componentKey: true,
                                    defaultStylesJsonb: true,
                                    version: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!page) {
                throw new AppError(ERROR_CODES.PAGE_NOT_FOUND, 'Page not found', 404);
            }

            const settings = (instance.settingsJsonb as unknown as WebsiteSettings) || DEFAULT_WEBSITE_SETTINGS;

            const sections: SDUISection[] = page.sections.map((sec) => ({
                id: sec.id,
                type: sec.theme.componentKey,
                props: sec.contentJsonb as Record<string, unknown>,
                styles: {
                    ...(sec.theme.defaultStylesJsonb as Record<string, unknown>),
                    ...(sec.stylesJsonb as Record<string, unknown>),
                },
                conditions: (sec.conditionsJsonb as unknown as SDUISection['conditions']) || [],
                position: sec.position,
            }));

            const manifest: SDUIManifest = {
                instanceId,
                page: {
                    id: page.id,
                    slug: page.slug,
                    title: page.title,
                },
                tokens: settings.tokens || (DEFAULT_WEBSITE_SETTINGS.tokens as unknown as WebsiteSettings['tokens']),
                features: settings.features || DEFAULT_WEBSITE_SETTINGS.features,
                sections,
            };

            res.json({ success: true, data: manifest });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get website settings for the current instance.
     */
    static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;

            const instance = await db.instance.findUnique({
                where: { id: instanceId },
                select: { settingsJsonb: true, industryId: true },
            });

            if (!instance) {
                throw new AppError(ERROR_CODES.INSTANCE_NOT_FOUND, 'Instance not found', 404);
            }

            res.json({
                success: true,
                data: {
                    settings: instance.settingsJsonb || DEFAULT_WEBSITE_SETTINGS,
                    industryId: instance.industryId,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update website settings (colors, fonts, features, header, footer).
     */
    static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const updates = req.body;

            const instance = await db.instance.findUnique({ where: { id: instanceId } });
            if (!instance) {
                throw new AppError(ERROR_CODES.INSTANCE_NOT_FOUND, 'Instance not found', 404);
            }

            // Deep merge: existing settings + updates
            const current = (instance.settingsJsonb as Record<string, unknown>) || DEFAULT_WEBSITE_SETTINGS;
            const merged = deepMerge(current, updates);

            const updated = await db.instance.update({
                where: { id: instanceId },
                data: { settingsJsonb: JSON.parse(JSON.stringify(merged)) },
                select: { settingsJsonb: true },
            });

            res.json({ success: true, data: { settings: updated.settingsJsonb } });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Check whether the current instance can be published on the current plan.
     */
    static async publishReadiness(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tenantId = req.tenant!.id;
            const instanceId = req.instance!.id;
            const readiness = await getPublishReadinessForInstance(tenantId, instanceId);
            res.json({ success: true, data: readiness });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Publish the current instance website.
     * Creates a new PublishRecord with incremented version.
     */
    static async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const tenantId = req.tenant!.id;
            const userId = req.auth!.userId;

            // Get instance + all pages + sections
            const instance = await db.instance.findUnique({ where: { id: instanceId } });
            if (!instance) {
                throw new AppError(ERROR_CODES.INSTANCE_NOT_FOUND, 'Instance not found', 404);
            }

            const publishReadiness = await getPublishReadinessForInstance(tenantId, instanceId);
            if (!publishReadiness.canPublish) {
                throw new AppError('PLAN_LIMIT_REACHED', publishReadiness.message || 'Your plan cannot publish this website.', 403);
            }

            const pages = await db.page.findMany({
                where: { instanceId },
                orderBy: { sortOrder: 'asc' },
                include: {
                    sections: {
                        where: { enabled: true },
                        orderBy: { position: 'asc' },
                        include: {
                            theme: {
                                select: { componentKey: true, defaultStylesJsonb: true, version: true },
                            },
                        },
                    },
                },
            });

            if (pages.length === 0) {
                throw new AppError(ERROR_CODES.PUBLISH_FAILED, 'No pages to publish', 400);
            }

            // Get next version
            const lastPublish = await db.publishRecord.findFirst({
                where: { instanceId },
                orderBy: { version: 'desc' },
            });
            const nextVersion = (lastPublish?.version ?? 0) + 1;

            const settings = (instance.settingsJsonb as unknown as WebsiteSettings) || DEFAULT_WEBSITE_SETTINGS;
            const websiteSeo = settings.seo && typeof settings.seo === 'object' ? settings.seo : null;
            const websiteSeoDefaults = normalizeSeoData(websiteSeo?.defaults);
            const websiteSeoBusiness = normalizeSeoBusiness(websiteSeo?.business);
            const siteName = (typeof websiteSeo?.siteName === 'string' && websiteSeo.siteName.trim())
                ? websiteSeo.siteName.trim()
                : instance.name;
            const primaryDomain = instance.customDomain || instance.fullDomain || buildPrimaryFullDomain(instance.subdomain);

            // Build full manifest for all pages
            const fullManifest = pages.map((page) => ({
                page: {
                    id: page.id,
                    slug: page.slug,
                    title: page.title,
                    seo: normalizeSeoData(page.seoJsonb),
                },
                sections: page.sections.map((sec) => ({
                    id: sec.id,
                    type: sec.theme.componentKey,
                    props: sec.contentJsonb,
                    styles: {
                        ...(sec.theme.defaultStylesJsonb as Record<string, unknown>),
                        ...(sec.stylesJsonb as Record<string, unknown>),
                    },
                    conditions: sec.conditionsJsonb || [],
                    position: sec.position,
                })),
            }));

            const publishRecord = await db.publishRecord.create({
                data: {
                    tenantId,
                    instanceId,
                    version: nextVersion,
                    status: 'published',
                    publishedAt: new Date(),
                    publishedBy: userId,
                    manifestJsonb: JSON.parse(JSON.stringify({
                        tenantId,
                        instanceId,
                        subdomain: instance.subdomain,
                        fullDomain: instance.fullDomain || buildPrimaryFullDomain(instance.subdomain),
                        primaryDomain,
                        defaultPageSlug: fullManifest[0]?.page.slug || '/',
                        siteName,
                        seoDefaults: websiteSeoDefaults,
                        seoBusiness: websiteSeoBusiness,
                        tokens: settings.tokens || DEFAULT_WEBSITE_SETTINGS.tokens,
                        features: settings.features || DEFAULT_WEBSITE_SETTINGS.features,
                        header: settings.header || DEFAULT_WEBSITE_SETTINGS.header,
                        footer: settings.footer || DEFAULT_WEBSITE_SETTINGS.footer,
                        customCode: settings.customCode,
                        pages: fullManifest,
                    })),
                },
            });

            // Mark all pages as published
            await db.page.updateMany({
                where: { instanceId },
                data: { isPublished: true },
            });

            // Upload the static site to S3/R2
            const s3Service = new S3Service();
            await s3Service.uploadPublishedWebsite({
                instanceId: instance.id,
                subdomain: instance.subdomain,
                version: publishRecord.version,
                manifest: publishRecord.manifestJsonb,
            });

            try {
                await RoutingIndexService.rebuildAndPublish({
                    changedHosts: [instance.fullDomain || '', instance.customDomain || ''],
                });
            } catch (indexError) {
                logger.warn('Routing index rebuild failed after publish (fail-open)', {
                    instanceId,
                    subdomain: instance.subdomain,
                    version: publishRecord.version,
                    error: indexError instanceof Error ? indexError.message : String(indexError),
                });
            }

            // Fail-open cache invalidation (publish should still succeed on purge failure)
            try {
                await invalidatePublishedSiteCache({
                    action: 'publish',
                    subdomain: instance.subdomain,
                    fullDomain: instance.fullDomain || null,
                    customDomain: instance.customDomain,
                    manifest: publishRecord.manifestJsonb,
                    version: publishRecord.version,
                });
            } catch (cacheError) {
                logger.warn('Cache invalidation failed after publish (fail-open)', {
                    instanceId,
                    subdomain: instance.subdomain,
                    version: publishRecord.version,
                    error: cacheError instanceof Error ? cacheError.message : String(cacheError),
                });
            }

            res.status(201).json({
                success: true,
                data: {
                    id: publishRecord.id,
                    version: publishRecord.version,
                    status: publishRecord.status,
                    publishedAt: publishRecord.publishedAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Manually purge Cloudflare cache for the current instance hosts.
     */
    static async purgeCache(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const instance = await db.instance.findUnique({
                where: { id: instanceId },
                select: { subdomain: true, fullDomain: true, customDomain: true },
            });

            if (!instance) {
                throw new AppError(ERROR_CODES.INSTANCE_NOT_FOUND, 'Instance not found', 404);
            }

            try {
                const result = await invalidatePublishedSiteCache(
                    {
                        action: 'manual',
                        subdomain: instance.subdomain,
                        fullDomain: instance.fullDomain || null,
                        customDomain: instance.customDomain,
                        version: 0,
                    },
                    { failOpen: false },
                );

                res.json({
                    success: true,
                    data: {
                        subdomain: instance.subdomain,
                        hosts: result.hosts,
                        attempted: result.attempted,
                        purged: result.purged,
                        failed: result.failed,
                    },
                });
            } catch (error) {
                throw new AppError(
                    ERROR_CODES.PUBLISH_FAILED,
                    error instanceof Error ? error.message : 'Cache purge failed',
                    502,
                );
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get publish history for the current instance.
     */
    static async publishHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;

            const records = await db.publishRecord.findMany({
                where: { instanceId },
                orderBy: { version: 'desc' },
                take: 20,
            });

            res.json({ success: true, data: records });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Rollback to a previous published version.
     * Marks the target version as the current "published" version
     * and marks the current live version as "draft".
     */
    static async rollback(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const { version } = req.body as { version: number };

            if (!version || typeof version !== 'number') {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'version (number) is required', 400);
            }

            // Find the target version
            const targetRecord = await db.publishRecord.findFirst({
                where: { instanceId, version },
            });
            if (!targetRecord || !targetRecord.manifestJsonb) {
                throw new AppError(ERROR_CODES.NOT_FOUND, `Published version ${version} not found`, 404);
            }

            // Mark all current "published" records for this instance as "draft"
            await db.publishRecord.updateMany({
                where: { instanceId, status: 'published' },
                data: { status: 'draft' },
            });

            // Mark the target version as "published"
            const updated = await db.publishRecord.update({
                where: { id: targetRecord.id },
                data: { status: 'published', publishedAt: new Date() },
            });

            // Also rollback the static site on S3/R2
            // We need to fetch the instance to get the subdomain
            const instance = await db.instance.findUnique({ where: { id: instanceId } });
            if (instance && targetRecord.manifestJsonb) {
                const s3Service = new S3Service();
                await s3Service.uploadPublishedWebsite({
                    instanceId: instance.id,
                    subdomain: instance.subdomain,
                    version: updated.version,
                    manifest: targetRecord.manifestJsonb,
                });

                try {
                    await RoutingIndexService.rebuildAndPublish({
                        changedHosts: [instance.fullDomain || '', instance.customDomain || ''],
                    });
                } catch (indexError) {
                    logger.warn('Routing index rebuild failed after rollback (fail-open)', {
                        instanceId,
                        subdomain: instance.subdomain,
                        version: updated.version,
                        error: indexError instanceof Error ? indexError.message : String(indexError),
                    });
                }

                // Fail-open cache invalidation (rollback should still succeed on purge failure)
                try {
                    await invalidatePublishedSiteCache({
                        action: 'rollback',
                        subdomain: instance.subdomain,
                        fullDomain: instance.fullDomain || null,
                        customDomain: instance.customDomain,
                        manifest: targetRecord.manifestJsonb,
                        version: updated.version,
                    });
                } catch (cacheError) {
                    logger.warn('Cache invalidation failed after rollback (fail-open)', {
                        instanceId,
                        subdomain: instance.subdomain,
                        version: updated.version,
                        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
                    });
                }
            }

            res.json({
                success: true,
                data: {
                    id: updated.id,
                    version: updated.version,
                    status: updated.status,
                    publishedAt: updated.publishedAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

/**
 * Simple deep merge utility for nested objects.
 */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result = { ...target };
    for (const key of Object.keys(source)) {
        const targetVal = target[key];
        const sourceVal = source[key];
        if (
            targetVal && sourceVal &&
            typeof targetVal === 'object' && typeof sourceVal === 'object' &&
            !Array.isArray(targetVal) && !Array.isArray(sourceVal)
        ) {
            result[key] = deepMerge(
                targetVal as Record<string, unknown>,
                sourceVal as Record<string, unknown>,
            );
        } else {
            result[key] = sourceVal;
        }
    }
    return result;
}
