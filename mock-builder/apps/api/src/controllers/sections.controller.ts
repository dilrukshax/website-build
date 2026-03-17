import { Request, Response, NextFunction } from 'express';
import { db } from '@booking-engine/database';
import { ERROR_CODES } from '@booking-engine/core';
import { AppError } from '../middleware/error';

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
                            schemaJsonb: true,
                            defaultStylesJsonb: true,
                            version: true,
                            feature: { select: { id: true, name: true, slug: true } },
                        },
                    },
                },
            });

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
            });
            if (!section) {
                throw new AppError(ERROR_CODES.SECTION_NOT_FOUND, 'Section not found', 404);
            }

            const updated = await db.pageSection.update({
                where: { id },
                data: {
                    ...(contentJsonb !== undefined && { contentJsonb }),
                    ...(stylesJsonb !== undefined && { stylesJsonb }),
                    ...(enabled !== undefined && { enabled }),
                    ...(conditionsJsonb !== undefined && { conditionsJsonb }),
                },
                include: {
                    theme: {
                        select: {
                            id: true,
                            name: true,
                            componentKey: true,
                            schemaJsonb: true,
                            defaultStylesJsonb: true,
                            version: true,
                        },
                    },
                },
            });

            res.json({ success: true, data: updated });
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
