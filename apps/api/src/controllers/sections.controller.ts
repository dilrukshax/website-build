import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';
import { PlanPolicyService } from '../services/plan-policy.service';

const GLOBAL_LAYOUT_FEATURE_SLUGS = new Set(['header', 'footer']);

function getFeatureSlugFromComponentKey(componentKey: string): string {
    return componentKey.split('/')[0] || '';
}

function getSharedLayoutFeatureFromComponentKey(componentKey: string): 'header' | 'footer' | null {
    const featureSlug = getFeatureSlugFromComponentKey(componentKey);
    if (!GLOBAL_LAYOUT_FEATURE_SLUGS.has(featureSlug)) {
        return null;
    }

    return featureSlug as 'header' | 'footer';
}

export class SectionsController {
    static async listByPage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const pageId = req.params.pageId!;

            // Verify page belongs to instance
            const page = await db.page.findFirst({ where: { id: pageId, instanceId } });
            if (!page) {
                throw new AppError(ERROR_CODES.PAGE_NOT_FOUND, 'Page not found', 404);
            }

            const sections = await db.pageSection.findMany({
                where: { pageId },
                orderBy: { position: 'asc' },
                include: {
                    theme: {
                        select: {
                            id: true,
                            name: true,
                            componentKey: true,
                            accessRank: true,
                            schemaJsonb: true,
                            defaultStylesJsonb: true,
                            version: true,
                            feature: { select: { id: true, name: true, slug: true } },
                        },
                    },
                },
            });

            res.json({ success: true, data: sections });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const tenantId = req.tenant!.id;
            const pageId = req.params.pageId!;
            const { themeId, position, contentJsonb, stylesJsonb } = req.body;

            // Verify page belongs to instance
            const page = await db.page.findFirst({ where: { id: pageId, instanceId } });
            if (!page) {
                throw new AppError(ERROR_CODES.PAGE_NOT_FOUND, 'Page not found', 404);
            }

            // Verify theme exists
            const theme = await db.theme.findUnique({ where: { id: themeId } });
            if (!theme || !theme.isActive) {
                throw new AppError(ERROR_CODES.THEME_NOT_FOUND, 'Theme not found or inactive', 404, 'themeId');
            }

            const sharedLayoutFeature = getSharedLayoutFeatureFromComponentKey(theme.componentKey);
            if (sharedLayoutFeature) {
                const existingSectionsOnPage = await db.pageSection.findMany({
                    where: {
                        instanceId,
                        pageId,
                    },
                    include: {
                        theme: {
                            select: {
                                componentKey: true,
                            },
                        },
                    },
                });

                const existingShared = existingSectionsOnPage.find((sectionOnPage) =>
                    getSharedLayoutFeatureFromComponentKey(sectionOnPage.theme.componentKey) === sharedLayoutFeature
                );

                if (existingShared) {
                    throw new AppError(ERROR_CODES.INVALID_INPUT, `${theme.name} already exists on this page`, 409, 'themeId');
                }
            }

            // Determine position
            let finalPosition = position;
            if (finalPosition === undefined) {
                const maxPos = await db.pageSection.aggregate({
                    where: { pageId },
                    _max: { position: true },
                });
                finalPosition = (maxPos._max.position ?? -1) + 1;
            }

            const section = await db.pageSection.create({
                data: {
                    tenantId,
                    instanceId,
                    pageId,
                    themeId,
                    themeVersionUsed: theme.version,
                    position: finalPosition,
                    contentJsonb: contentJsonb || {},
                    stylesJsonb: stylesJsonb || theme.defaultStylesJsonb,
                },
                include: {
                    theme: {
                        select: {
                            id: true,
                            name: true,
                            componentKey: true,
                            accessRank: true,
                            schemaJsonb: true,
                            defaultStylesJsonb: true,
                            version: true,
                            feature: { select: { id: true, name: true, slug: true } },
                        },
                    },
                },
            });

            const createdSectionSharedLayoutFeature = getSharedLayoutFeatureFromComponentKey(section.theme.componentKey);
            if (createdSectionSharedLayoutFeature) {
                await syncGlobalLayoutSectionAcrossPages({
                    tenantId,
                    instanceId,
                    sharedLayoutFeature: createdSectionSharedLayoutFeature,
                    sourceSection: {
                        id: section.id,
                        themeId: section.theme.id,
                        themeVersionUsed: section.themeVersionUsed,
                        enabled: section.enabled,
                        contentJsonb: section.contentJsonb,
                        stylesJsonb: section.stylesJsonb,
                        conditionsJsonb: section.conditionsJsonb,
                    },
                });
            }

            res.status(201).json({ success: true, data: section });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const tenantId = req.tenant!.id;
            const id = req.params.id!;
            const { themeId, contentJsonb, stylesJsonb, enabled, conditionsJsonb } = req.body;

            const section = await db.pageSection.findFirst({
                where: { id, instanceId },
                include: {
                    theme: {
                        select: {
                            id: true,
                            componentKey: true,
                            featureId: true,
                        },
                    },
                },
            });
            if (!section) {
                throw new AppError(ERROR_CODES.SECTION_NOT_FOUND, 'Section not found', 404);
            }

            const updateData: Record<string, unknown> = {
                ...(contentJsonb !== undefined && { contentJsonb }),
                ...(stylesJsonb !== undefined && { stylesJsonb }),
                ...(enabled !== undefined && { enabled }),
                ...(conditionsJsonb !== undefined && { conditionsJsonb }),
            };

            if (themeId !== undefined && themeId !== section.theme.id) {
                await PlanPolicyService.assertCanUseTheme(tenantId, themeId);

                const nextTheme = await db.theme.findUnique({
                    where: { id: themeId },
                    select: {
                        id: true,
                        name: true,
                        featureId: true,
                        componentKey: true,
                        version: true,
                        isActive: true,
                    },
                });

                if (!nextTheme || !nextTheme.isActive) {
                    throw new AppError(ERROR_CODES.THEME_NOT_FOUND, 'Theme not found or inactive', 404, 'themeId');
                }

                if (nextTheme.featureId !== section.theme.featureId) {
                    throw new AppError(
                        ERROR_CODES.INVALID_INPUT,
                        'Selected theme must match the same section type.',
                        400,
                        'themeId',
                    );
                }

                const nextThemeSharedLayoutFeature = getSharedLayoutFeatureFromComponentKey(nextTheme.componentKey);
                if (nextThemeSharedLayoutFeature) {
                    const existingSectionsOnPage = await db.pageSection.findMany({
                        where: {
                            pageId: section.pageId,
                            instanceId,
                            id: { not: section.id },
                        },
                        include: {
                            theme: {
                                select: {
                                    componentKey: true,
                                },
                            },
                        },
                    });

                    const existingShared = existingSectionsOnPage.find((sectionOnPage) =>
                        getSharedLayoutFeatureFromComponentKey(sectionOnPage.theme.componentKey) === nextThemeSharedLayoutFeature
                    );

                    if (existingShared) {
                        throw new AppError(ERROR_CODES.INVALID_INPUT, `${nextTheme.name} already exists on this page`, 409, 'themeId');
                    }
                }

                updateData.themeId = nextTheme.id;
                updateData.themeVersionUsed = nextTheme.version;
            }

            const updated = await db.pageSection.update({
                where: { id },
                data: updateData,
                include: {
                    theme: {
                        select: {
                            id: true,
                            name: true,
                            componentKey: true,
                            accessRank: true,
                            schemaJsonb: true,
                            defaultStylesJsonb: true,
                            version: true,
                            feature: { select: { id: true, name: true, slug: true } },
                        },
                    },
                },
            });

            const syncSharedLayoutFeatures = new Set<'header' | 'footer'>();
            const previousSharedLayoutFeature = getSharedLayoutFeatureFromComponentKey(section.theme.componentKey);
            if (previousSharedLayoutFeature) {
                syncSharedLayoutFeatures.add(previousSharedLayoutFeature);
            }
            const nextSharedLayoutFeature = getSharedLayoutFeatureFromComponentKey(updated.theme.componentKey);
            if (nextSharedLayoutFeature) {
                syncSharedLayoutFeatures.add(nextSharedLayoutFeature);
            }

            for (const sharedLayoutFeature of syncSharedLayoutFeatures) {
                await syncGlobalLayoutSectionAcrossPages({
                    tenantId,
                    instanceId,
                    sharedLayoutFeature,
                    sourceSection: {
                        id: updated.id,
                        themeId: updated.theme.id,
                        themeVersionUsed: updated.themeVersionUsed,
                        enabled: updated.enabled,
                        contentJsonb: updated.contentJsonb,
                        stylesJsonb: updated.stylesJsonb,
                        conditionsJsonb: updated.conditionsJsonb,
                    },
                });
            }

            const refreshed = await db.pageSection.findUnique({
                where: { id: updated.id },
                include: {
                    theme: {
                        select: {
                            id: true,
                            name: true,
                            componentKey: true,
                            accessRank: true,
                            schemaJsonb: true,
                            defaultStylesJsonb: true,
                            version: true,
                            feature: { select: { id: true, name: true, slug: true } },
                        },
                    },
                },
            });

            res.json({ success: true, data: refreshed || updated });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const id = req.params.id!;

            const section = await db.pageSection.findFirst({
                where: { id, instanceId },
            });
            if (!section) {
                throw new AppError(ERROR_CODES.SECTION_NOT_FOUND, 'Section not found', 404);
            }

            await db.pageSection.delete({ where: { id } });
            res.json({ success: true, data: { message: 'Section deleted' } });
        } catch (error) {
            next(error);
        }
    }

    static async reorder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const pageId = req.params.pageId!;
            const { sections } = req.body as { sections: Array<{ id: string; position: number }> };

            // Verify page belongs to instance
            const page = await db.page.findFirst({ where: { id: pageId, instanceId } });
            if (!page) {
                throw new AppError(ERROR_CODES.PAGE_NOT_FOUND, 'Page not found', 404);
            }

            await db.$transaction(
                sections.map((s) =>
                    db.pageSection.updateMany({
                        where: { id: s.id, pageId },
                        data: { position: s.position },
                    })
                )
            );

            res.json({ success: true, data: { message: 'Sections reordered' } });
        } catch (error) {
            next(error);
        }
    }
}

async function syncGlobalLayoutSectionAcrossPages(params: {
    tenantId: string;
    instanceId: string;
    sharedLayoutFeature: 'header' | 'footer';
    sourceSection: {
        id: string;
        themeId: string;
        themeVersionUsed: number;
        enabled: boolean;
        contentJsonb: unknown;
        stylesJsonb: unknown;
        conditionsJsonb: unknown;
    };
}): Promise<void> {
    const { tenantId, instanceId, sharedLayoutFeature, sourceSection } = params;

    await db.$transaction(async (tx) => {
        const pages = await tx.page.findMany({
            where: { instanceId },
            select: { id: true },
            orderBy: { sortOrder: 'asc' },
        });

        const existingSections = await tx.pageSection.findMany({
            where: {
                instanceId,
            },
            select: {
                id: true,
                pageId: true,
                position: true,
                theme: {
                    select: {
                        componentKey: true,
                    },
                },
            },
            orderBy: [
                { pageId: 'asc' },
                { position: 'asc' },
            ],
        });

        const relevantExistingSections = existingSections.filter((section) =>
            getSharedLayoutFeatureFromComponentKey(section.theme.componentKey) === sharedLayoutFeature
        );

        const byPage = new Map<string, Array<{ id: string; pageId: string; position: number }>>();
        for (const sec of relevantExistingSections) {
            const list = byPage.get(sec.pageId) || [];
            list.push(sec);
            byPage.set(sec.pageId, list);
        }

        const canonicalIds: string[] = [];
        const duplicateIds: string[] = [];
        const missingPageIds: string[] = [];

        for (const page of pages) {
            const list = byPage.get(page.id) || [];
            if (list.length === 0) {
                missingPageIds.push(page.id);
                continue;
            }

            canonicalIds.push(list[0]!.id);
            for (const extra of list.slice(1)) {
                duplicateIds.push(extra.id);
            }
        }

        if (canonicalIds.length > 0) {
            await tx.pageSection.updateMany({
                where: { id: { in: canonicalIds } },
                data: {
                    themeId: sourceSection.themeId,
                    themeVersionUsed: sourceSection.themeVersionUsed,
                    enabled: sourceSection.enabled,
                    contentJsonb: sourceSection.contentJsonb as any,
                    stylesJsonb: sourceSection.stylesJsonb as any,
                    conditionsJsonb: sourceSection.conditionsJsonb as any,
                },
            });
        }

        if (duplicateIds.length > 0) {
            await tx.pageSection.deleteMany({
                where: { id: { in: duplicateIds } },
            });
        }

        for (const pageId of missingPageIds) {
            if (sharedLayoutFeature === 'header') {
                await tx.pageSection.updateMany({
                    where: { pageId },
                    data: { position: { increment: 1 } },
                });

                await tx.pageSection.create({
                    data: {
                        tenantId,
                        instanceId,
                        pageId,
                        themeId: sourceSection.themeId,
                        themeVersionUsed: sourceSection.themeVersionUsed,
                        position: 0,
                        enabled: sourceSection.enabled,
                        contentJsonb: sourceSection.contentJsonb as any,
                        stylesJsonb: sourceSection.stylesJsonb as any,
                        conditionsJsonb: sourceSection.conditionsJsonb as any,
                    },
                });

                continue;
            }

            const maxPos = await tx.pageSection.aggregate({
                where: { pageId },
                _max: { position: true },
            });

            await tx.pageSection.create({
                data: {
                    tenantId,
                    instanceId,
                    pageId,
                    themeId: sourceSection.themeId,
                    themeVersionUsed: sourceSection.themeVersionUsed,
                    position: (maxPos._max.position ?? -1) + 1,
                    enabled: sourceSection.enabled,
                    contentJsonb: sourceSection.contentJsonb as any,
                    stylesJsonb: sourceSection.stylesJsonb as any,
                    conditionsJsonb: sourceSection.conditionsJsonb as any,
                },
            });
        }
    });
}
