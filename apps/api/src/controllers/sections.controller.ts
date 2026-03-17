import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

const GLOBAL_LAYOUT_COMPONENT_KEYS = new Set(['header/v1', 'footer/v1']);

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

            if (GLOBAL_LAYOUT_COMPONENT_KEYS.has(theme.componentKey)) {
                const existingShared = await db.pageSection.findFirst({
                    where: {
                        instanceId,
                        pageId,
                        theme: { componentKey: theme.componentKey },
                    },
                });

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

            if (GLOBAL_LAYOUT_COMPONENT_KEYS.has(section.theme.componentKey)) {
                await syncGlobalLayoutSectionAcrossPages({
                    tenantId,
                    instanceId,
                    componentKey: section.theme.componentKey,
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
            const id = req.params.id!;
            const { contentJsonb, stylesJsonb, enabled, conditionsJsonb } = req.body;

            const section = await db.pageSection.findFirst({
                where: { id, instanceId },
                include: {
                    theme: {
                        select: {
                            componentKey: true,
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
                        },
                    },
                },
            });

            if (GLOBAL_LAYOUT_COMPONENT_KEYS.has(section.theme.componentKey)) {
                await syncGlobalLayoutSectionAcrossPages({
                    tenantId: req.tenant!.id,
                    instanceId,
                    componentKey: section.theme.componentKey,
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
    componentKey: string;
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
    const { tenantId, instanceId, componentKey, sourceSection } = params;

    await db.$transaction(async (tx) => {
        const pages = await tx.page.findMany({
            where: { instanceId },
            select: { id: true },
            orderBy: { sortOrder: 'asc' },
        });

        const existingSections = await tx.pageSection.findMany({
            where: {
                instanceId,
                theme: { componentKey },
            },
            select: {
                id: true,
                pageId: true,
                position: true,
            },
            orderBy: [
                { pageId: 'asc' },
                { position: 'asc' },
            ],
        });

        const byPage = new Map<string, Array<{ id: string; pageId: string; position: number }>>();
        for (const sec of existingSections) {
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
            if (componentKey === 'header/v1') {
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
