import { Request, Response, NextFunction } from 'express';
import { db } from '@project-aurora/database';
import { ERROR_CODES, DEFAULT_WEBSITE_SETTINGS } from '@project-aurora/core';
import type { WebsiteSettings } from '@project-aurora/core';
import { AppError } from '../middleware/error';

const SHARED_LAYOUT_FEATURE_SLUGS = new Set(['header', 'footer']);
const HOME_PAGE_SLUG = '/';

interface TemplateSectionConfig {
    themeComponentKey: string;
    defaultContent: Record<string, unknown>;
    defaultStyles: Record<string, unknown>;
}

interface SectionCreateInput {
    themeId: string;
    themeVersionUsed: number;
    enabled: boolean;
    contentJsonb: Record<string, unknown>;
    stylesJsonb: Record<string, unknown>;
    conditionsJsonb?: unknown;
}

function getFeatureSlugFromComponentKey(componentKey: string): string {
    return componentKey.split('/')[0] || '';
}

function getSharedLayoutFeatureFromComponentKey(componentKey: string): 'header' | 'footer' | null {
    const featureSlug = getFeatureSlugFromComponentKey(componentKey);
    if (!SHARED_LAYOUT_FEATURE_SLUGS.has(featureSlug)) {
        return null;
    }

    return featureSlug as 'header' | 'footer';
}

function isSharedLayoutComponentKey(componentKey: string): boolean {
    return Boolean(getSharedLayoutFeatureFromComponentKey(componentKey));
}

function normalizePageSlug(rawSlug: unknown): string {
    const value = String(rawSlug ?? '').trim().toLowerCase();
    if (value === HOME_PAGE_SLUG) {
        return HOME_PAGE_SLUG;
    }

    return value.replace(/^\/+/, '').replace(/\/+$/, '');
}

const WEBSITE_TOKEN_KEYS: Array<keyof WebsiteSettings['tokens']> = [
    'primary',
    'secondary',
    'accent',
    'text',
    'background',
    'font',
];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractTemplateTokenOverrides(sections: TemplateSectionConfig[]): Partial<WebsiteSettings['tokens']> {
    const headerSection = sections.find((section) =>
        getSharedLayoutFeatureFromComponentKey(section.themeComponentKey) === 'header'
    );

    if (!headerSection || !isRecord(headerSection.defaultStyles)) {
        return {};
    }

    const themeTokens = headerSection.defaultStyles.themeTokens;
    if (!isRecord(themeTokens)) {
        return {};
    }

    const overrides: Partial<WebsiteSettings['tokens']> = {};
    for (const tokenKey of WEBSITE_TOKEN_KEYS) {
        const value = themeTokens[tokenKey];
        if (typeof value === 'string' && value.trim().length > 0) {
            overrides[tokenKey] = value.trim();
        }
    }

    return overrides;
}

export class PagesController {
    static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;

            const pages = await db.page.findMany({
                where: { instanceId },
                orderBy: { sortOrder: 'asc' },
                include: {
                    _count: { select: { sections: true } },
                },
            });

            res.json({
                success: true,
                data: pages.map((p) => ({
                    id: p.id,
                    slug: p.slug,
                    title: p.title,
                    isPublished: p.isPublished,
                    sortOrder: p.sortOrder,
                    sectionCount: p._count.sections,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                })),
            });
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const tenantId = req.tenant!.id;
            const { title, slug, seoJsonb } = req.body;
            const normalizedSlug = normalizePageSlug(slug);

            const totalPages = await db.page.count({ where: { instanceId } });
            if (totalPages === 0 && normalizedSlug !== HOME_PAGE_SLUG) {
                throw new AppError(
                    ERROR_CODES.INVALID_INPUT,
                    'Create the Home page first. The first page slug must be "/".',
                    400,
                    'slug',
                );
            }

            if (totalPages > 0 && normalizedSlug === HOME_PAGE_SLUG) {
                throw new AppError(ERROR_CODES.SLUG_TAKEN, 'Home page already exists', 409, 'slug');
            }

            if (totalPages > 0) {
                const homePage = await db.page.findFirst({
                    where: { instanceId, slug: HOME_PAGE_SLUG },
                    include: {
                        _count: {
                            select: {
                                sections: true,
                            },
                        },
                    },
                });

                if (!homePage) {
                    throw new AppError(
                        ERROR_CODES.INVALID_INPUT,
                        'Create the Home page ("/") before adding more pages.',
                        400,
                        'slug',
                    );
                }

                if (homePage._count.sections === 0) {
                    throw new AppError(
                        ERROR_CODES.INVALID_INPUT,
                        'Set up the Home page with a template or at least one section before adding more pages.',
                        400,
                        'slug',
                    );
                }
            }

            // Check slug uniqueness within instance
            const existing = await db.page.findFirst({
                where: { instanceId, slug: normalizedSlug },
            });
            if (existing) {
                throw new AppError(ERROR_CODES.SLUG_TAKEN, 'A page with this slug already exists', 409, 'slug');
            }

            // Get max sortOrder for positioning
            const maxOrder = await db.page.aggregate({
                where: { instanceId },
                _max: { sortOrder: true },
            });
            const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

            const page = await db.page.create({
                data: {
                    tenantId,
                    instanceId,
                    title,
                    slug: normalizedSlug,
                    seoJsonb: seoJsonb || null,
                    sortOrder: nextOrder,
                },
            });

            // New pages should inherit shared layout sections to keep header/footer consistent.
            await cloneSharedLayoutSectionsToNewPage({
                tenantId,
                instanceId,
                newPageId: page.id,
            });

            res.status(201).json({ success: true, data: page });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const id = req.params.id!;

            const page = await db.page.findFirst({
                where: { id, instanceId },
                include: {
                    sections: {
                        where: { enabled: true },
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
                    },
                },
            });

            if (!page) {
                throw new AppError(ERROR_CODES.PAGE_NOT_FOUND, 'Page not found', 404);
            }

            res.json({ success: true, data: page });
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const id = req.params.id!;
            const { title, slug, seoJsonb, isPublished } = req.body;
            const normalizedSlug = slug !== undefined ? normalizePageSlug(slug) : undefined;

            const page = await db.page.findFirst({ where: { id, instanceId } });
            if (!page) {
                throw new AppError(ERROR_CODES.PAGE_NOT_FOUND, 'Page not found', 404);
            }

            if (normalizedSlug !== undefined) {
                if (page.slug === HOME_PAGE_SLUG && normalizedSlug !== HOME_PAGE_SLUG) {
                    throw new AppError(ERROR_CODES.INVALID_INPUT, 'Home page slug cannot be changed', 400, 'slug');
                }

                if (page.slug !== HOME_PAGE_SLUG && normalizedSlug === HOME_PAGE_SLUG) {
                    throw new AppError(ERROR_CODES.INVALID_INPUT, 'Only the Home page can use "/" slug', 400, 'slug');
                }
            }

            // Check slug uniqueness if changing
            if (normalizedSlug && normalizedSlug !== page.slug) {
                const existing = await db.page.findFirst({
                    where: { instanceId, slug: normalizedSlug, NOT: { id } },
                });
                if (existing) {
                    throw new AppError(ERROR_CODES.SLUG_TAKEN, 'A page with this slug already exists', 409, 'slug');
                }
            }

            const updated = await db.page.update({
                where: { id },
                data: {
                    ...(title !== undefined && { title }),
                    ...(normalizedSlug !== undefined && { slug: normalizedSlug }),
                    ...(seoJsonb !== undefined && { seoJsonb }),
                    ...(isPublished !== undefined && { isPublished }),
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

            const page = await db.page.findFirst({ where: { id, instanceId } });
            if (!page) {
                throw new AppError(ERROR_CODES.PAGE_NOT_FOUND, 'Page not found', 404);
            }

            if (page.slug === HOME_PAGE_SLUG) {
                throw new AppError(ERROR_CODES.INVALID_INPUT, 'Home page cannot be deleted', 400);
            }

            await db.page.delete({ where: { id } });
            res.json({ success: true, data: { message: 'Page deleted' } });
        } catch (error) {
            next(error);
        }
    }

    static async reorder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const { pages } = req.body as { pages: Array<{ id: string; sortOrder: number }> };

            // Update all pages in a transaction
            await db.$transaction(
                pages.map((p) =>
                    db.page.updateMany({
                        where: { id: p.id, instanceId },
                        data: { sortOrder: p.sortOrder },
                    })
                )
            );

            res.json({ success: true, data: { message: 'Pages reordered' } });
        } catch (error) {
            next(error);
        }
    }

    static async applyTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const instanceId = req.instance!.id;
            const tenantId = req.tenant!.id;
            const id = req.params.id!;
            const {
                templateId,
                replaceSharedLayoutContent = false,
            } = (req.body || {}) as {
                templateId: string;
                replaceSharedLayoutContent?: boolean;
            };

            const page = await db.page.findFirst({ where: { id, instanceId } });
            if (!page) {
                throw new AppError(ERROR_CODES.PAGE_NOT_FOUND, 'Page not found', 404);
            }

            const template = await db.pageTemplate.findUnique({ where: { id: templateId } });
            if (!template || !template.isActive) {
                throw new AppError(ERROR_CODES.INVALID_INPUT, 'Template not found or inactive', 404);
            }

            // Parse the sections JSON from the template
            const sections = template.sectionsJsonb as unknown as TemplateSectionConfig[];
            if (!Array.isArray(sections) || sections.length === 0) {
                throw new AppError(ERROR_CODES.INVALID_INPUT, 'Template has no sections to apply', 400);
            }
            const templateTokenOverrides = extractTemplateTokenOverrides(sections);

            // Fetch the corresponding Theme IDs based on component keys
            const componentKeys = Array.from(new Set(sections.map((s) => s.themeComponentKey).filter(Boolean)));
            const themes = await db.theme.findMany({
                where: { componentKey: { in: componentKeys }, isActive: true }
            });
            const themeMap = new Map(themes.map(t => [t.componentKey, t]));

            const missingComponentKeys = componentKeys.filter((key) => !themeMap.has(key));
            if (missingComponentKeys.length > 0) {
                const missingFeatureSlugs = Array.from(
                    new Set(missingComponentKeys.map((key) => getFeatureSlugFromComponentKey(key)).filter(Boolean))
                );

                if (missingFeatureSlugs.length > 0) {
                    const fallbackThemes = await db.theme.findMany({
                        where: {
                            isActive: true,
                            OR: missingFeatureSlugs.map((featureSlug) => ({
                                componentKey: { startsWith: `${featureSlug}/` },
                            })),
                        },
                        orderBy: { version: 'desc' },
                    });

                    const fallbackByFeature = new Map<string, (typeof fallbackThemes)[number]>();
                    for (const fallbackTheme of fallbackThemes) {
                        const fallbackFeatureSlug = getFeatureSlugFromComponentKey(fallbackTheme.componentKey);
                        if (fallbackFeatureSlug && !fallbackByFeature.has(fallbackFeatureSlug)) {
                            fallbackByFeature.set(fallbackFeatureSlug, fallbackTheme);
                        }
                    }

                    for (const missingComponentKey of missingComponentKeys) {
                        const featureSlug = getFeatureSlugFromComponentKey(missingComponentKey);
                        const fallbackTheme = fallbackByFeature.get(featureSlug);
                        if (fallbackTheme) {
                            themeMap.set(missingComponentKey, fallbackTheme);
                        }
                    }
                }
            }

            const unresolvedComponentKeys = componentKeys.filter((key) => !themeMap.has(key));
            if (unresolvedComponentKeys.length > 0) {
                if (unresolvedComponentKeys.length === componentKeys.length) {
                    throw new AppError(
                        ERROR_CODES.INVALID_INPUT,
                        'Template cannot be applied because no active themes are available. Ask an admin to seed the theme catalog first.',
                        400,
                    );
                }

                const previewKeys = unresolvedComponentKeys.slice(0, 8).join(', ');
                const extraSuffix = unresolvedComponentKeys.length > 8
                    ? ` (+${unresolvedComponentKeys.length - 8} more)`
                    : '';

                throw new AppError(
                    ERROR_CODES.INVALID_INPUT,
                    `Template cannot be applied because required section themes are missing: ${previewKeys}${extraSuffix}`,
                    400,
                );
            }

            // Keep existing header/footer if already present on this page.
            const existingSharedSections = await db.pageSection.findMany({
                where: {
                    pageId: id,
                    instanceId,
                    enabled: true,
                },
                include: {
                    theme: {
                        select: {
                            componentKey: true,
                        },
                    },
                },
                orderBy: { position: 'asc' },
            });

            const existingHeader = existingSharedSections.find((sec) =>
                getSharedLayoutFeatureFromComponentKey(sec.theme.componentKey) === 'header'
            );
            const existingFooter = existingSharedSections.find((sec) =>
                getSharedLayoutFeatureFromComponentKey(sec.theme.componentKey) === 'footer'
            );
            const templateHeader = sections.find((sec) =>
                getSharedLayoutFeatureFromComponentKey(sec.themeComponentKey) === 'header'
            );
            const templateFooter = sections.find((sec) =>
                getSharedLayoutFeatureFromComponentKey(sec.themeComponentKey) === 'footer'
            );
            const templateBodySections = sections.filter((sec) => !isSharedLayoutComponentKey(sec.themeComponentKey));

            const sectionsToCreate: SectionCreateInput[] = [];
            const pushTemplateSection = (sectionConfig: TemplateSectionConfig | undefined) => {
                if (!sectionConfig) return;
                const theme = themeMap.get(sectionConfig.themeComponentKey);
                if (!theme) return;

                sectionsToCreate.push({
                    themeId: theme.id,
                    themeVersionUsed: theme.version,
                    enabled: true,
                    contentJsonb: sectionConfig.defaultContent || {},
                    stylesJsonb: sectionConfig.defaultStyles || {},
                });
            };

            const buildSharedLayoutSection = (
                existingSection: typeof existingSharedSections[number] | undefined,
                templateSection: TemplateSectionConfig | undefined,
            ): SectionCreateInput | null => {
                const templateTheme = templateSection
                    ? themeMap.get(templateSection.themeComponentKey)
                    : undefined;

                if (replaceSharedLayoutContent && templateSection && templateTheme) {
                    return {
                        themeId: templateTheme.id,
                        themeVersionUsed: templateTheme.version,
                        enabled: true,
                        contentJsonb: templateSection.defaultContent || {},
                        stylesJsonb: templateSection.defaultStyles || {},
                    };
                }

                if (existingSection && templateTheme) {
                    return {
                        themeId: templateTheme.id,
                        themeVersionUsed: templateTheme.version,
                        enabled: existingSection.enabled,
                        contentJsonb: existingSection.contentJsonb as Record<string, unknown>,
                        stylesJsonb: existingSection.stylesJsonb as Record<string, unknown>,
                        conditionsJsonb: existingSection.conditionsJsonb,
                    };
                }

                if (existingSection) {
                    return {
                        themeId: existingSection.themeId,
                        themeVersionUsed: existingSection.themeVersionUsed,
                        enabled: existingSection.enabled,
                        contentJsonb: existingSection.contentJsonb as Record<string, unknown>,
                        stylesJsonb: existingSection.stylesJsonb as Record<string, unknown>,
                        conditionsJsonb: existingSection.conditionsJsonb,
                    };
                }

                if (templateSection && templateTheme) {
                    return {
                        themeId: templateTheme.id,
                        themeVersionUsed: templateTheme.version,
                        enabled: true,
                        contentJsonb: templateSection.defaultContent || {},
                        stylesJsonb: templateSection.defaultStyles || {},
                    };
                }

                return null;
            };

            const resolvedHeader = buildSharedLayoutSection(existingHeader, templateHeader);
            if (resolvedHeader) {
                sectionsToCreate.push(resolvedHeader);
            }

            templateBodySections.forEach((sectionConfig) => {
                pushTemplateSection(sectionConfig);
            });

            const resolvedFooter = buildSharedLayoutSection(existingFooter, templateFooter);
            if (resolvedFooter) {
                sectionsToCreate.push(resolvedFooter);
            }

            if (sectionsToCreate.length === 0) {
                throw new AppError(
                    ERROR_CODES.INVALID_INPUT,
                    'Template resolved to zero sections. Please verify active themes in the catalog.',
                    400,
                );
            }

            const createdSections = await db.$transaction(async (tx) => {
                // Delete any existing sections for this page before applying the template.
                await tx.pageSection.deleteMany({ where: { pageId: id } });

                // Create final sections (header/body/footer), preserving shared layout when present.
                const created = [];
                for (let i = 0; i < sectionsToCreate.length; i++) {
                    const sectionData = sectionsToCreate[i]!;
                    const newSection = await tx.pageSection.create({
                        data: {
                            tenantId,
                            instanceId,
                            pageId: id,
                            themeId: sectionData.themeId,
                            themeVersionUsed: sectionData.themeVersionUsed,
                            position: i,
                            enabled: sectionData.enabled,
                            contentJsonb: sectionData.contentJsonb as any,
                            stylesJsonb: sectionData.stylesJsonb as any,
                            ...(sectionData.conditionsJsonb !== undefined && { conditionsJsonb: sectionData.conditionsJsonb as any }),
                        },
                    });
                    created.push(newSection);
                }

                if (Object.keys(templateTokenOverrides).length > 0) {
                    const instance = await tx.instance.findUnique({
                        where: { id: instanceId },
                        select: { settingsJsonb: true },
                    });

                    if (instance) {
                        const currentSettings = (instance.settingsJsonb as WebsiteSettings | null)
                            || (DEFAULT_WEBSITE_SETTINGS as unknown as WebsiteSettings);
                        const mergedSettings: WebsiteSettings = {
                            ...currentSettings,
                            tokens: {
                                ...(currentSettings.tokens || (DEFAULT_WEBSITE_SETTINGS.tokens as WebsiteSettings['tokens'])),
                                ...templateTokenOverrides,
                            },
                        };

                        await tx.instance.update({
                            where: { id: instanceId },
                            data: { settingsJsonb: JSON.parse(JSON.stringify(mergedSettings)) },
                        });
                    }
                }

                return created;
            });

            res.json({ success: true, data: { message: 'Template applied successfully', sections: createdSections } });
        } catch (error) {
            next(error);
        }
    }
}

async function cloneSharedLayoutSectionsToNewPage(params: {
    tenantId: string;
    instanceId: string;
    newPageId: string;
}): Promise<void> {
    const { tenantId, instanceId, newPageId } = params;

    const candidatePages = await db.page.findMany({
        where: {
            instanceId,
            id: { not: newPageId },
        },
        orderBy: { sortOrder: 'asc' },
        include: {
            sections: {
                where: {
                    enabled: true,
                },
                orderBy: { position: 'asc' },
                include: {
                    theme: {
                        select: {
                            componentKey: true,
                        },
                    },
                },
            },
        },
    });

    if (candidatePages.length === 0) return;

    let headerSection: (typeof candidatePages)[number]['sections'][number] | null = null;
    let footerSection: (typeof candidatePages)[number]['sections'][number] | null = null;

    for (const page of candidatePages) {
        for (const section of page.sections) {
            const layoutFeature = getSharedLayoutFeatureFromComponentKey(section.theme.componentKey);
            if (!layoutFeature) {
                continue;
            }

            if (!headerSection && layoutFeature === 'header') {
                headerSection = section;
            }
            if (!footerSection && layoutFeature === 'footer') {
                footerSection = section;
            }
            if (headerSection && footerSection) {
                break;
            }
        }

        if (headerSection && footerSection) {
            break;
        }
    }

    const sharedSections = [headerSection, footerSection].filter((section) =>
        Boolean(section && isSharedLayoutComponentKey(section.theme.componentKey))
    ) as Array<NonNullable<typeof headerSection>>;

    if (sharedSections.length === 0) return;

    await db.$transaction(
        sharedSections.map((section, position) =>
            db.pageSection.create({
                data: {
                    tenantId,
                    instanceId,
                    pageId: newPageId,
                    themeId: section.themeId,
                    themeVersionUsed: section.themeVersionUsed,
                    position,
                    enabled: section.enabled,
                    contentJsonb: section.contentJsonb as any,
                    stylesJsonb: section.stylesJsonb as any,
                    ...(section.conditionsJsonb !== null && { conditionsJsonb: section.conditionsJsonb as any }),
                },
            })
        )
    );
}
