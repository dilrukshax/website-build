import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES, DEFAULT_WEBSITE_SETTINGS } from '@booking-engine/core';
import type { SDUIManifest, SDUISection, WebsiteSettings } from '@booking-engine/core';
import { AppError } from '../middleware/error';

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

            // Build full manifest for all pages
            const fullManifest = pages.map((page) => ({
                page: { id: page.id, slug: page.slug, title: page.title },
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
                        tokens: settings.tokens || DEFAULT_WEBSITE_SETTINGS.tokens,
                        features: settings.features || DEFAULT_WEBSITE_SETTINGS.features,
                        header: settings.header || DEFAULT_WEBSITE_SETTINGS.header,
                        footer: settings.footer || DEFAULT_WEBSITE_SETTINGS.footer,
                        pages: fullManifest,
                    })),
                },
            });

            // Mark all pages as published
            await db.page.updateMany({
                where: { instanceId },
                data: { isPublished: true },
            });

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
