'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ChevronsLeft,
    ChevronsRight,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Eye,
    FileText,
    GripVertical,
    LayoutTemplate,
    Monitor,
    Plus,
    Settings2,
    Smartphone,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useAuth } from '../../../contexts/auth-context';
import { api } from '../../../lib/api-client';
import { useHostedFont } from '../../../lib/use-hosted-font';
import { SectionRenderer } from '../../../components/builder/section-renderer';
import { SchemaForm } from '../../../components/builder/schema-form';
import { ThemePicker, type ThemeCatalogTheme } from '../../../components/builder/theme-picker';
import { TemplatePicker } from '../../../components/builder/template-picker';

interface PageData {
    id: string;
    slug: string;
    title: string;
    seoJsonb: SEOData | null;
    isPublished: boolean;
    sortOrder: number;
    sectionCount: number;
}

type TwitterCardType = 'summary' | 'summary_large_image';

interface SEOData {
    metaTitle?: string | null;
    metaDescription?: string | null;
    metaKeywords?: string | null;
    canonicalPath?: string | null;
    robotsIndex?: boolean | null;
    robotsFollow?: boolean | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImageUrl?: string | null;
    ogImageAlt?: string | null;
    twitterCard?: TwitterCardType | null;
    twitterTitle?: string | null;
    twitterDescription?: string | null;
    twitterImageUrl?: string | null;
    twitterImageAlt?: string | null;
}

interface WebsiteSEOBusiness {
    businessType?: string | null;
    name?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    telephone?: string | null;
    email?: string | null;
    priceRange?: string | null;
    streetAddress?: string | null;
    addressLocality?: string | null;
    addressRegion?: string | null;
    postalCode?: string | null;
    addressCountry?: string | null;
    sameAs?: string[] | null;
}

interface WebsiteSEOSettings {
    siteName?: string | null;
    defaults?: SEOData | null;
    business?: WebsiteSEOBusiness | null;
}


interface SectionData {
    id: string;
    position: number;
    enabled: boolean;
    contentJsonb: Record<string, unknown>;
    stylesJsonb: Record<string, unknown>;
    theme: {
        id: string;
        name: string;
        componentKey: string;
        accessRank: number;
        schemaJsonb: Record<string, unknown>;
        defaultStylesJsonb: Record<string, unknown>;
        version: number;
        feature?: { id: string; name: string; slug: string };
    };
}

interface WebsiteCustomCodeSettings {
    head?: string | null;
    bodyTop?: string | null;
    bodyBottom?: string | null;
}

interface WebsiteSettings {
    tokens: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
        background: string;
        font: string;
    };
    features: Record<string, boolean>;
    header: Record<string, unknown>;
    footer: Record<string, unknown>;
    seo?: WebsiteSEOSettings;
    customCode?: WebsiteCustomCodeSettings;
}

interface BillingUsageSnapshot {
    limits: {
        maxPagesPerInstance: number | null;
    };
    instanceUsage: {
        pages: number;
    } | null;
}

interface PublishReadinessSnapshot {
    canPublish: boolean;
    message: string | null;
    maxAccessibleThemes: number | null;
    blockedThemes: Array<{
        id: string;
        name: string;
        componentKey: string;
        accessRank: number;
    }>;
}

const DEFAULT_TOKENS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    text: '#1f2937',
    background: '#ffffff',
    font: 'Inter',
};

const SERVICES_SECTION_DEFAULT_CONTENT = {
    showAllServices: true,
    featuredCount: 3,
    showSelectButton: true,
    selectButtonText: 'Select Service',
    ctaText: '',
    ctaLink: '',
    bottomCtaText: 'Book Your Setup Call',
    bottomCtaLink: '#booking-widget',
} as const;
const BLOG_SECTION_DEFAULT_CONTENT = {
    showAllPosts: true,
    featuredCount: 3,
    ctaText: '',
    ctaLink: '/blog',
} as const;
const HOME_PAGE_SLUG = '/';
const HOME_PAGE_SLUG_ALIASES = new Set([HOME_PAGE_SLUG]);
const HOME_PAGE_TITLE = 'Home';
const BLOG_PAGE_SLUG = 'blog';
const BLOG_PAGE_SLUG_ALIASES = new Set([BLOG_PAGE_SLUG, '/blog']);
const BLOG_PAGE_TITLE = 'Blog';
const ABOUT_PAGE_SLUG = 'about';
const ABOUT_PAGE_SLUG_ALIASES = new Set([ABOUT_PAGE_SLUG, '/about']);
const ABOUT_PAGE_TITLE = 'About Us';
const CONTACT_PAGE_SLUG = 'contact';
const CONTACT_PAGE_SLUG_ALIASES = new Set([CONTACT_PAGE_SLUG, '/contact']);
const CONTACT_PAGE_TITLE = 'Contact Us';
const LEGACY_HIDDEN_PAGE_SLUG_ALIASES = new Set(['blog-layout', '/blog-layout']);
const BLOG_FEATURE_ID = 'feature-blog';
const BLOG_SECTION_COMPONENT_KEY_BY_TEMPLATE: Record<string, string> = {
    'template-2026-editorial-pulse': 'blog/v15',
};
const BLOG_TEMPLATE_IDS = new Set<string>([
    'template-2026-editorial-pulse',
]);
const BLOG_TEMPLATE_FORCE_REPLACE_SHARED_LAYOUT_IDS = new Set<string>([
    'template-2026-editorial-pulse',
]);
const TRAIN_OF_THOUGHT_STACK = {
    home: ['header/v15', 'hero/v15', 'blog/v15', 'footer/v15'],
    blog: ['header/v15', 'blog/v15', 'footer/v15'],
    about: ['header/v15', 'about/v15', 'footer/v15'],
    contact: ['header/v15', 'contact/v15', 'footer/v15'],
} as const;
const PAGE_TITLE_SUGGESTIONS = ['About', 'Team', 'Services', 'Contact'] as const;

const SECTION_AUTOSAVE_DELAY_MS = 700;
interface PendingSectionSave {
    sectionId: string;
    contentJsonb: Record<string, unknown>;
    stylesJsonb: Record<string, unknown>;
}

type BuilderOperation =
    | 'createPage'
    | 'deletePage'
    | 'addSection'
    | 'changeSectionTheme'
    | 'applyTemplate'
    | 'deleteSection'
    | 'moveSection'
    | 'publish';

const OPERATION_MESSAGES: Record<BuilderOperation, string> = {
    createPage: 'Creating page...',
    deletePage: 'Deleting page...',
    addSection: 'Adding section...',
    changeSectionTheme: 'Updating section theme...',
    applyTemplate: 'Applying template...',
    deleteSection: 'Deleting section...',
    moveSection: 'Reordering section...',
    publish: 'Publishing website...',
};

function isHeaderComponentKey(componentKey: string): boolean {
    return componentKey.startsWith('header/');
}

function isFooterComponentKey(componentKey: string): boolean {
    return componentKey.startsWith('footer/');
}

function normalizeServicesSchema(
    schema: React.ComponentProps<typeof SchemaForm>['schema']
): React.ComponentProps<typeof SchemaForm>['schema'] {
    const rawProperties = schema.properties || {};
    const normalized: Record<string, unknown> = {};

    const withFallback = (key: string, fallback: Record<string, unknown>) => {
        normalized[key] = (rawProperties as Record<string, unknown>)[key] ?? fallback;
    };

    withFallback('title', { type: 'string', title: 'Section Title' });
    withFallback('subtitle', { type: 'string', title: 'Subtitle', format: 'textarea' });

    if ((rawProperties as Record<string, unknown>).items) {
        normalized.items = (rawProperties as Record<string, unknown>).items;
    }
    if ((rawProperties as Record<string, unknown>).servicesList) {
        normalized.servicesList = (rawProperties as Record<string, unknown>).servicesList;
    }
    if ((rawProperties as Record<string, unknown>).services) {
        normalized.services = (rawProperties as Record<string, unknown>).services;
    }

    withFallback('ctaText', { type: 'string', title: 'Button Text (Optional)' });
    withFallback('ctaLink', { type: 'string', title: 'Button Link', format: 'page-link' });
    withFallback('bottomCtaText', { type: 'string', title: 'Bottom Button Text' });
    withFallback('bottomCtaLink', { type: 'string', title: 'Bottom Button Link', format: 'page-link' });
    withFallback('showAllServices', { type: 'boolean', title: 'Show All Services' });
    withFallback('featuredCount', { type: 'number', title: 'Featured Services Count' });
    withFallback('showSelectButton', { type: 'boolean', title: 'Show Select Service Button' });
    withFallback('selectButtonText', { type: 'string', title: 'Select Button Text' });

    for (const [key, value] of Object.entries(rawProperties)) {
        if (!(key in normalized)) {
            normalized[key] = value;
        }
    }

    return {
        ...schema,
        properties: normalized as React.ComponentProps<typeof SchemaForm>['schema']['properties'],
        required: schema.required || [],
    };
}

function normalizeHeaderSchema(
    schema: React.ComponentProps<typeof SchemaForm>['schema']
): React.ComponentProps<typeof SchemaForm>['schema'] {
    const rawProperties = schema.properties || {};
    const menuField = rawProperties.menu ?? {
        type: 'array',
        title: 'Navigation Menu',
        items: {
            type: 'object',
            properties: {
                label: { type: 'string', title: 'Label' },
                href: { type: 'string', title: 'Link', format: 'page-link' },
            },
            required: ['label', 'href'],
        },
    };

    return {
        ...schema,
        properties: {
            projectName: rawProperties.projectName ?? { type: 'string', title: 'Project Name' },
            projectIcon: rawProperties.projectIcon ?? { type: 'string', title: 'Project Icon', format: 'image' },
            logoUrl: rawProperties.logoUrl ?? { type: 'string', title: 'Logo', format: 'image' },
            logoAlt: rawProperties.logoAlt ?? { type: 'string', title: 'Logo Alt Text' },
            menu: menuField,
        },
        required: schema.required || [],
    };
}

function normalizeBlogSchema(
    schema: React.ComponentProps<typeof SchemaForm>['schema']
): React.ComponentProps<typeof SchemaForm>['schema'] {
    const rawProperties = schema.properties || {};
    const normalized: Record<string, unknown> = {};

    const withFallback = (key: string, fallback: Record<string, unknown>) => {
        normalized[key] = (rawProperties as Record<string, unknown>)[key] ?? fallback;
    };

    withFallback('title', { type: 'string', title: 'Section Title' });
    withFallback('subtitle', { type: 'string', title: 'Subtitle', format: 'textarea' });
    withFallback('showAllPosts', { type: 'boolean', title: 'Show All Posts' });
    withFallback('featuredCount', { type: 'number', title: 'Featured Count' });
    withFallback('ctaText', { type: 'string', title: 'Button Text (Optional)' });
    withFallback('ctaLink', { type: 'string', title: 'Button Link', format: 'page-link' });

    if ((rawProperties as Record<string, unknown>).postsList) {
        normalized.postsList = (rawProperties as Record<string, unknown>).postsList;
    }

    for (const [key, value] of Object.entries(rawProperties)) {
        if (!(key in normalized)) {
            normalized[key] = value;
        }
    }

    return {
        ...schema,
        properties: normalized as React.ComponentProps<typeof SchemaForm>['schema']['properties'],
        required: schema.required || [],
    };
}

function findPageBySlugAliases(candidates: PageData[], aliases: Set<string>): PageData | null {
    return candidates.find((page) => aliases.has(page.slug)) || null;
}

function formatFirstValidationDetailMessage(
    details: Array<{ field: string; message: string }> | undefined,
    fallback: string,
): string {
    const firstDetail = details?.[0];
    if (!firstDetail) {
        return fallback;
    }

    return firstDetail.field
        ? `${firstDetail.field}: ${firstDetail.message}`
        : firstDetail.message;
}

async function ensureBuilderPageBySlug({
    pages,
    aliases,
    title,
    slug,
}: {
    pages: PageData[];
    aliases: Set<string>;
    title: string;
    slug: string;
}): Promise<{ page: PageData | null; created: boolean; errorMessage: string | null }> {
    const existingPage = findPageBySlugAliases(pages, aliases);
    if (existingPage) {
        return { page: existingPage, created: false, errorMessage: null };
    }

    const createRes = await api.post<PageData>('/cms/pages', { title, slug });
    if (!createRes.success || !createRes.data) {
        return {
            page: null,
            created: false,
            errorMessage: formatFirstValidationDetailMessage(
                createRes.error?.details,
                createRes.error?.message || `Failed to create ${title} page`,
            ),
        };
    }

    return { page: createRes.data, created: true, errorMessage: null };
}

async function resolveCatalogThemeByComponentKey({
    featureId,
    componentKey,
}: {
    featureId: string;
    componentKey: string;
}): Promise<{ theme: ThemeCatalogTheme | null; errorMessage: string | null }> {
    const themeRes = await api.get<ThemeCatalogTheme[]>(
        `/cms/catalog/themes?featureId=${encodeURIComponent(featureId)}&includePremiumPreview=true`,
    );

    if (!themeRes.success || !themeRes.data) {
        return {
            theme: null,
            errorMessage: themeRes.error?.message || 'Failed to load theme catalog',
        };
    }

    const theme = themeRes.data.find((entry) => entry.componentKey === componentKey) || null;
    if (!theme) {
        return {
            theme: null,
            errorMessage: `Theme ${componentKey} is missing from catalog`,
        };
    }

    return { theme, errorMessage: null };
}

function getFeatureSlugFromComponentKey(componentKey: string): string {
    return componentKey.split('/')[0] || '';
}

async function applyTemplateToPage({
    pageId,
    templateId,
    replaceSharedLayoutContent,
}: {
    pageId: string;
    templateId: string;
    replaceSharedLayoutContent?: boolean;
}): Promise<{ success: boolean; errorMessage: string | null }> {
    const response = await api.post(`/cms/pages/${pageId}/apply-template`, {
        templateId,
        ...(replaceSharedLayoutContent ? { replaceSharedLayoutContent: true } : {}),
    });

    if (!response.success) {
        return {
            success: false,
            errorMessage: formatFirstValidationDetailMessage(
                response.error?.details,
                response.error?.message || 'Failed to apply template',
            ),
        };
    }

    return {
        success: true,
        errorMessage: null,
    };
}

async function normalizePageSectionsToStack({
    pageId,
    desiredComponentKeys,
    themesByComponentKey,
    defaultContentByComponentKey = {},
}: {
    pageId: string;
    desiredComponentKeys: readonly string[];
    themesByComponentKey: Record<string, ThemeCatalogTheme>;
    defaultContentByComponentKey?: Record<string, Record<string, unknown>>;
}): Promise<{ success: boolean; errorMessage: string | null }> {
    const initialSectionsRes = await api.get<SectionData[]>(`/cms/pages/${pageId}/sections`);
    if (!initialSectionsRes.success || !initialSectionsRes.data) {
        return {
            success: false,
            errorMessage: initialSectionsRes.error?.message || 'Failed to load page sections',
        };
    }

    const selectedSectionIds: string[] = [];
    const initialSections = initialSectionsRes.data;

    for (const desiredComponentKey of desiredComponentKeys) {
        const existingExact = initialSections.find((section) =>
            !selectedSectionIds.includes(section.id) && section.theme.componentKey === desiredComponentKey
        );
        if (existingExact) {
            selectedSectionIds.push(existingExact.id);
            continue;
        }

        const desiredTheme = themesByComponentKey[desiredComponentKey];
        if (!desiredTheme) {
            return {
                success: false,
                errorMessage: `Theme ${desiredComponentKey} is missing from catalog`,
            };
        }

        const desiredFeatureSlug = getFeatureSlugFromComponentKey(desiredComponentKey);
        const existingFeatureMatch = initialSections.find((section) =>
            !selectedSectionIds.includes(section.id)
            && getFeatureSlugFromComponentKey(section.theme.componentKey) === desiredFeatureSlug
        );

        if (existingFeatureMatch) {
            if (existingFeatureMatch.theme.componentKey !== desiredComponentKey) {
                const updateRes = await api.put<SectionData>(`/cms/sections/${existingFeatureMatch.id}`, {
                    themeId: desiredTheme.id,
                });
                if (!updateRes.success) {
                    return {
                        success: false,
                        errorMessage: updateRes.error?.message || `Failed to update ${desiredComponentKey} section`,
                    };
                }
            }

            selectedSectionIds.push(existingFeatureMatch.id);
            continue;
        }

        const createRes = await api.post<SectionData>(`/cms/pages/${pageId}/sections`, {
            themeId: desiredTheme.id,
            ...(defaultContentByComponentKey[desiredComponentKey]
                ? { contentJsonb: defaultContentByComponentKey[desiredComponentKey] }
                : {}),
        });
        if (!createRes.success || !createRes.data) {
            return {
                success: false,
                errorMessage: createRes.error?.message || `Failed to create ${desiredComponentKey} section`,
            };
        }

        selectedSectionIds.push(createRes.data.id);
    }

    const refreshedSectionsRes = await api.get<SectionData[]>(`/cms/pages/${pageId}/sections`);
    if (!refreshedSectionsRes.success || !refreshedSectionsRes.data) {
        return {
            success: false,
            errorMessage: refreshedSectionsRes.error?.message || 'Failed to load sections for stack normalization',
        };
    }

    const selectedSet = new Set(selectedSectionIds);
    const sectionsToDelete = refreshedSectionsRes.data.filter((section) => !selectedSet.has(section.id));
    for (const section of sectionsToDelete) {
        const deleteRes = await api.del(`/cms/sections/${section.id}`);
        if (!deleteRes.success) {
            return {
                success: false,
                errorMessage: deleteRes.error?.message || `Failed to remove ${section.theme.componentKey} section`,
            };
        }
    }

    const reorderPayload = selectedSectionIds.map((id, position) => ({ id, position }));
    const reorderRes = await api.put(`/cms/pages/${pageId}/sections/reorder`, { sections: reorderPayload });
    if (!reorderRes.success) {
        return {
            success: false,
            errorMessage: reorderRes.error?.message || 'Failed to reorder sections',
        };
    }

    return {
        success: true,
        errorMessage: null,
    };
}

export default function BuilderPage() {
    const { currentTenant, currentInstance } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [pages, setPages] = useState<PageData[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [sections, setSections] = useState<SectionData[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [settings, setSettings] = useState<WebsiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [pageSwitching, setPageSwitching] = useState(false);
    const [pageSwitchingTargetId, setPageSwitchingTargetId] = useState<string | null>(null);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [themePickerOpen, setThemePickerOpen] = useState(false);
    const [themePickerMode, setThemePickerMode] = useState<'add' | 'replace'>('add');
    const [themePickerTargetSectionId, setThemePickerTargetSectionId] = useState<string | null>(null);
    const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
    const [newPageTitle, setNewPageTitle] = useState('');
    const [showNewPage, setShowNewPage] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
    const [billingUsage, setBillingUsage] = useState<BillingUsageSnapshot | null>(null);
    const [publishReadiness, setPublishReadiness] = useState<PublishReadinessSnapshot | null>(null);
    const [sectionDrafts, setSectionDrafts] = useState<Record<string, Record<string, unknown>>>({});
    const [sectionStyleDrafts, setSectionStyleDrafts] = useState<Record<string, Record<string, unknown>>>({});
    const [sectionSaveState, setSectionSaveState] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
    const [sectionSaveError, setSectionSaveError] = useState('');
    const sectionAutosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sectionSaveResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSectionSaveRef = useRef<PendingSectionSave | null>(null);
    const latestSectionSaveRequestIdRef = useRef(0);
    const isMountedRef = useRef(true);
    const activeInstanceIdRef = useRef<string | null>(null);
    const selectedPageIdRef = useRef<string | null>(null);
    const activeOperationRef = useRef<BuilderOperation | null>(null);
    const [activeOperation, setActiveOperation] = useState<BuilderOperation | null>(null);

    const tokens = settings?.tokens || DEFAULT_TOKENS;
    const builderPanel = searchParams.get('panel');
    const requestedWebsiteSettingsTab = searchParams.get('tab');
    useHostedFont(tokens.font);

    const selectedPage = pages.find((page) => page.id === selectedPageId) || null;
    const selectedSection = sections.find((s) => s.id === selectedSectionId);
    const themePickerTargetSection = sections.find((section) => section.id === themePickerTargetSectionId) || null;
    const isServicesSection = selectedSection?.theme.componentKey.startsWith('services/') === true;
    const isBlogSection = selectedSection?.theme.componentKey.startsWith('blog/') === true;
    const selectedSectionIndex = selectedSection
        ? sections.findIndex((section) => section.id === selectedSection.id)
        : -1;
    const selectedSectionSchema = selectedSection
        ? isServicesSection
            ? normalizeServicesSchema(
                selectedSection.theme.schemaJsonb as unknown as React.ComponentProps<typeof SchemaForm>['schema']
            )
            : isBlogSection
                ? normalizeBlogSchema(
                    selectedSection.theme.schemaJsonb as unknown as React.ComponentProps<typeof SchemaForm>['schema']
                )
            : isHeaderComponentKey(selectedSection.theme.componentKey)
                ? normalizeHeaderSchema(
                    selectedSection.theme.schemaJsonb as unknown as React.ComponentProps<typeof SchemaForm>['schema']
                )
                : selectedSection.theme.schemaJsonb as unknown as React.ComponentProps<typeof SchemaForm>['schema']
        : null;
    const selectedSectionBaseValues = selectedSection
        ? isServicesSection
            ? {
                ...SERVICES_SECTION_DEFAULT_CONTENT,
                ...selectedSection.contentJsonb,
            }
            : isBlogSection
                ? {
                    ...BLOG_SECTION_DEFAULT_CONTENT,
                    ...selectedSection.contentJsonb,
                }
            : isHeaderComponentKey(selectedSection.theme.componentKey)
                ? {
                    projectName: ((selectedSection.contentJsonb as Record<string, unknown>).projectName as string | undefined)
                        || ((selectedSection.contentJsonb as Record<string, unknown>).logoAlt as string | undefined)
                        || 'Your Project',
                    ...selectedSection.contentJsonb,
                }
            : selectedSection.contentJsonb
        : {};
    const selectedSectionValues = selectedSection
        ? sectionDrafts[selectedSection.id] || selectedSectionBaseValues
        : {};
    const selectedSectionStyleValues = selectedSection
        ? sectionStyleDrafts[selectedSection.id] || selectedSection.stylesJsonb
        : {};
    const pageLimitReached = billingUsage?.limits.maxPagesPerInstance !== null
        && (billingUsage?.instanceUsage?.pages || 0) >= (billingUsage?.limits.maxPagesPerInstance || 0);
    const canCreatePages = !pageLimitReached;
    const publishBlockedByPlan = Boolean(publishReadiness && !publishReadiness.canPublish);
    const existingGlobalLayoutKeys = Array.from(
        new Set(
            sections
                .map((section) => section.theme.componentKey)
                .filter((componentKey) => isHeaderComponentKey(componentKey) || isFooterComponentKey(componentKey)),
        ),
    );
    const existingGlobalLayoutFeatureSlugs = Array.from(
        new Set(
            sections
                .map((section) => section.theme.componentKey)
                .filter((componentKey) => isHeaderComponentKey(componentKey) || isFooterComponentKey(componentKey))
                .map((componentKey) => (isHeaderComponentKey(componentKey) ? 'header' : 'footer')),
        ),
    );
    const isOperationInProgress = activeOperation !== null;
    const isCreatingPage = activeOperation === 'createPage';
    const activeOperationMessage = activeOperation ? OPERATION_MESSAGES[activeOperation] : '';

    const beginOperation = useCallback((operation: BuilderOperation): boolean => {
        if (activeOperationRef.current) {
            return false;
        }

        activeOperationRef.current = operation;
        setActiveOperation(operation);
        return true;
    }, []);

    const endOperation = useCallback(() => {
        activeOperationRef.current = null;
        setActiveOperation(null);
    }, []);

    function openSectionInspector(sectionId: string) {
        setSelectedSectionId(sectionId);
        setShowSettings(false);
        setIsRightPanelOpen(true);
    }

    function openAddSectionThemePicker() {
        setThemePickerMode('add');
        setThemePickerTargetSectionId(null);
        setThemePickerOpen(true);
    }

    function openReplaceSectionThemePicker(sectionId: string) {
        setThemePickerMode('replace');
        setThemePickerTargetSectionId(sectionId);
        setShowSettings(false);
        setThemePickerOpen(true);
    }

    function closeThemePicker() {
        setThemePickerOpen(false);
        setThemePickerMode('add');
        setThemePickerTargetSectionId(null);
    }

    function openWebsiteSettingsInspector() {
        setShowSettings(true);
        setSelectedSectionId(null);
        setIsRightPanelOpen(true);
    }

    useEffect(() => {
        activeInstanceIdRef.current = currentInstance?.id || null;
    }, [currentInstance?.id]);

    useEffect(() => {
        selectedPageIdRef.current = selectedPageId;
    }, [selectedPageId]);

    // Load pages
    const loadPages = useCallback(async (preferredPageId: string | null = null): Promise<PageData[]> => {
        const requestInstanceId = activeInstanceIdRef.current;
        const res = await api.get<PageData[]>('/cms/pages');
        if (res.success && res.data) {
            if (requestInstanceId !== activeInstanceIdRef.current) {
                return [];
            }

            const nextPages = res.data.filter((page) => !LEGACY_HIDDEN_PAGE_SLUG_ALIASES.has(page.slug));
            setPages(nextPages);
            setSelectedPageId((currentPageId) => {
                const candidateId = preferredPageId || currentPageId;
                if (candidateId && nextPages.some((page) => page.id === candidateId)) {
                    return candidateId;
                }
                return nextPages[0]?.id || null;
            });
            return nextPages;
        }
        return [];
    }, []);

    // Load sections for selected page
    const loadSections = useCallback(async () => {
        if (!selectedPageId) return;
        const requestInstanceId = activeInstanceIdRef.current;
        const requestPageId = selectedPageId;
        const res = await api.get<SectionData[]>(`/cms/pages/${selectedPageId}/sections`);
        if (res.success && res.data) {
            if (requestInstanceId !== activeInstanceIdRef.current || requestPageId !== selectedPageIdRef.current) {
                return;
            }
            setSections(res.data);
        }
    }, [selectedPageId]);

    // Load settings
    const loadSettings = useCallback(async () => {
        const requestInstanceId = activeInstanceIdRef.current;
        const res = await api.get<{ settings: WebsiteSettings }>('/cms/builder/settings');
        if (res.success && res.data) {
            if (requestInstanceId !== activeInstanceIdRef.current) {
                return;
            }
            setSettings(res.data.settings);
        }
    }, []);

    const loadInstanceUsage = useCallback(async () => {
        const requestInstanceId = activeInstanceIdRef.current;
        if (!requestInstanceId) {
            setBillingUsage(null);
            return;
        }

        const res = await api.get<BillingUsageSnapshot>(`/cms/billing/usage?instanceId=${encodeURIComponent(requestInstanceId)}`);
        if (res.success && res.data) {
            if (requestInstanceId !== activeInstanceIdRef.current) {
                return;
            }
            setBillingUsage(res.data);
        }
    }, []);

    const loadPublishReadiness = useCallback(async () => {
        const requestInstanceId = activeInstanceIdRef.current;
        if (!requestInstanceId) {
            setPublishReadiness(null);
            return;
        }

        const res = await api.get<PublishReadinessSnapshot>('/cms/builder/publish-readiness');
        if (res.success && res.data) {
            if (requestInstanceId !== activeInstanceIdRef.current) {
                return;
            }
            setPublishReadiness(res.data);
        }
    }, []);

    const persistSectionChanges = useCallback(async (
        sectionId: string,
        contentJsonb: Record<string, unknown>,
        stylesJsonb: Record<string, unknown>,
    ) => {
        const requestId = ++latestSectionSaveRequestIdRef.current;
        setSectionSaveState('saving');
        setSectionSaveError('');

        const res = await api.put<SectionData>(`/cms/sections/${sectionId}`, { contentJsonb, stylesJsonb });

        if (!isMountedRef.current || requestId !== latestSectionSaveRequestIdRef.current) {
            return;
        }

        if (!res.success) {
            setSectionSaveState('error');
            setSectionSaveError(res.error?.message || 'Auto-save failed');
            return;
        }

        setSections((prevSections) => prevSections.map((section) =>
            section.id === sectionId
                ? { ...section, contentJsonb, stylesJsonb }
                : section,
        ));
        setSectionSaveState('saved');

        if (sectionSaveResetTimerRef.current) {
            clearTimeout(sectionSaveResetTimerRef.current);
        }
        sectionSaveResetTimerRef.current = setTimeout(() => {
            if (!isMountedRef.current) {
                return;
            }
            setSectionSaveState('idle');
            setSectionSaveError('');
        }, 1200);
    }, []);

    const flushPendingSectionSave = useCallback(async () => {
        if (sectionAutosaveTimerRef.current) {
            clearTimeout(sectionAutosaveTimerRef.current);
            sectionAutosaveTimerRef.current = null;
        }

        const pending = pendingSectionSaveRef.current;
        if (!pending) {
            return;
        }

        pendingSectionSaveRef.current = null;
        await persistSectionChanges(pending.sectionId, pending.contentJsonb, pending.stylesJsonb);
    }, [persistSectionChanges]);

    const handleSelectPage = useCallback(async (pageId: string) => {
        if (pageId === selectedPageId || pageSwitching || activeOperationRef.current) {
            return;
        }

        setPageSwitching(true);
        setPageSwitchingTargetId(pageId);
        await flushPendingSectionSave();
        setSelectedPageId(pageId);
        setSelectedSectionId(null);
        setShowSettings(false);
    }, [flushPendingSectionSave, pageSwitching, selectedPageId]);

    const scheduleSectionAutosave = useCallback((
        sectionId: string,
        contentJsonb: Record<string, unknown>,
        stylesJsonb: Record<string, unknown>,
    ) => {
        pendingSectionSaveRef.current = { sectionId, contentJsonb, stylesJsonb };

        if (sectionAutosaveTimerRef.current) {
            clearTimeout(sectionAutosaveTimerRef.current);
        }

        sectionAutosaveTimerRef.current = setTimeout(() => {
            const pending = pendingSectionSaveRef.current;
            if (!pending) {
                return;
            }

            pendingSectionSaveRef.current = null;
            void persistSectionChanges(pending.sectionId, pending.contentJsonb, pending.stylesJsonb);
        }, SECTION_AUTOSAVE_DELAY_MS);
    }, [persistSectionChanges]);

    const handleSectionDraftChange = useCallback((sectionId: string, contentJsonb: Record<string, unknown>) => {
        const currentStyles = sectionStyleDrafts[sectionId]
            || sections.find((section) => section.id === sectionId)?.stylesJsonb
            || {};
        setSectionDrafts((prevDrafts) => ({ ...prevDrafts, [sectionId]: contentJsonb }));
        setSections((prevSections) => prevSections.map((section) =>
            section.id === sectionId
                ? { ...section, contentJsonb }
                : section,
        ));
        setSectionSaveState('pending');
        setSectionSaveError('');
        scheduleSectionAutosave(sectionId, contentJsonb, currentStyles);
    }, [scheduleSectionAutosave, sectionStyleDrafts, sections]);

    const handleSectionStyleDraftChange = useCallback((sectionId: string, stylesJsonb: Record<string, unknown>) => {
        const currentContent = sectionDrafts[sectionId]
            || sections.find((section) => section.id === sectionId)?.contentJsonb
            || {};
        setSectionStyleDrafts((prevDrafts) => ({ ...prevDrafts, [sectionId]: stylesJsonb }));
        setSections((prevSections) => prevSections.map((section) =>
            section.id === sectionId
                ? { ...section, stylesJsonb }
                : section,
        ));
        setSectionSaveState('pending');
        setSectionSaveError('');
        scheduleSectionAutosave(sectionId, currentContent, stylesJsonb);
    }, [scheduleSectionAutosave, sectionDrafts, sections]);

    useEffect(() => {
        if (!currentInstance?.id) {
            setPages([]);
            setSections([]);
            setSelectedPageId(null);
            setSelectedSectionId(null);
            setShowSettings(false);
            setShowNewPage(false);
            setNewPageTitle('');
            setSectionDrafts({});
            setSectionStyleDrafts({});
            setPageSwitching(false);
            setPageSwitchingTargetId(null);
            setLoading(false);
            endOperation();
            return;
        }

        let cancelled = false;

        setPages([]);
        setSections([]);
        setSelectedPageId(null);
        setSelectedSectionId(null);
        setShowSettings(false);
        setShowNewPage(false);
        setNewPageTitle('');
        setSectionDrafts({});
        setSectionStyleDrafts({});
        setPageSwitching(false);
        setPageSwitchingTargetId(null);
        setLoading(true);
        endOperation();

        void Promise.all([loadPages(), loadSettings(), loadInstanceUsage(), loadPublishReadiness()]).finally(() => {
            if (!cancelled) {
                setLoading(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [currentInstance?.id, endOperation, loadPages, loadSettings, loadInstanceUsage, loadPublishReadiness]);

    useEffect(() => {
        if (selectedPageId) {
            let cancelled = false;
            void loadSections().finally(() => {
                if (!cancelled) {
                    setPageSwitching(false);
                    setPageSwitchingTargetId(null);
                }
            });
            return () => {
                cancelled = true;
            };
        }
        setSections([]);
        setPageSwitching(false);
        setPageSwitchingTargetId(null);
    }, [selectedPageId, loadSections]);

    useEffect(() => {
        if (selectedPageId) {
            return;
        }
        setSelectedSectionId(null);
    }, [selectedPageId]);

    useEffect(() => {
        setSectionDrafts((prevDrafts) => {
            const validSectionIds = new Set(sections.map((section) => section.id));
            let changed = false;
            const nextDrafts: Record<string, Record<string, unknown>> = {};

            for (const [sectionId, draft] of Object.entries(prevDrafts)) {
                if (validSectionIds.has(sectionId)) {
                    nextDrafts[sectionId] = draft;
                } else {
                    changed = true;
                }
            }

            return changed ? nextDrafts : prevDrafts;
        });
    }, [sections]);

    useEffect(() => {
        setSectionStyleDrafts((prevDrafts) => {
            const validSectionIds = new Set(sections.map((section) => section.id));
            let changed = false;
            const nextDrafts: Record<string, Record<string, unknown>> = {};

            for (const [sectionId, draft] of Object.entries(prevDrafts)) {
                if (validSectionIds.has(sectionId)) {
                    nextDrafts[sectionId] = draft;
                } else {
                    changed = true;
                }
            }

            return changed ? nextDrafts : prevDrafts;
        });
    }, [sections]);

    useEffect(() => {
        if (!showSettings && !selectedSectionId) {
            setIsRightPanelOpen(false);
        }
    }, [showSettings, selectedSectionId]);

    useEffect(() => {
        if (builderPanel === 'website-settings') {
            setShowSettings(true);
            setSelectedSectionId(null);
            setIsRightPanelOpen(true);
            return;
        }

        setShowSettings(false);
    }, [builderPanel]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            activeOperationRef.current = null;
            if (sectionAutosaveTimerRef.current) {
                clearTimeout(sectionAutosaveTimerRef.current);
            }
            if (sectionSaveResetTimerRef.current) {
                clearTimeout(sectionSaveResetTimerRef.current);
            }
            const pending = pendingSectionSaveRef.current;
            if (pending) {
                void api.put(`/cms/sections/${pending.sectionId}`, {
                    contentJsonb: pending.contentJsonb,
                    stylesJsonb: pending.stylesJsonb,
                });
            }
        };
    }, []);

    const createPageRecord = useCallback(async (input: {
        title: string;
        slug: string;
        openTemplatePicker?: boolean;
        resetNewPageState?: boolean;
    }): Promise<PageData | null> => {
        if (!canCreatePages) {
            alert('Page limit reached for this plan.');
            return null;
        }

        if (!beginOperation('createPage')) {
            return null;
        }

        try {
            const res = await api.post<PageData>('/cms/pages', { title: input.title, slug: input.slug });
            if (!res.success || !res.data) {
                alert(res.error?.message || 'Failed to create page');
                return null;
            }

            if (input.resetNewPageState !== false) {
                setNewPageTitle('');
                setShowNewPage(false);
            }
            setSelectedSectionId(null);
            setShowSettings(false);
            await loadPages(res.data.id);
            await loadInstanceUsage();
            await loadPublishReadiness();
            if (input.openTemplatePicker !== false) {
                setTemplatePickerOpen(true);
            }
            return res.data;
        } finally {
            endOperation();
        }
    }, [beginOperation, canCreatePages, endOperation, loadInstanceUsage, loadPages, loadPublishReadiness]);

    // Create page
    const handleCreatePage = async () => {
        const title = newPageTitle.trim();
        if (!title) return;

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        await createPageRecord({ title, slug: slug || 'page' });
    };

    const handleCreateHomePage = useCallback(async () => {
        const existingHome = pages.find((page) => page.slug === '/');
        if (existingHome) {
            setSelectedPageId(existingHome.id);
            setTemplatePickerOpen(true);
            return;
        }

        await createPageRecord({
            title: 'Home',
            slug: '/',
            openTemplatePicker: true,
            resetNewPageState: true,
        });
    }, [createPageRecord, pages]);

    // Delete page
    const handleDeletePage = async (pageId: string) => {
        const page = pages.find((entry) => entry.id === pageId);
        if (!page) return;

        if (!confirm(`Delete "${page.title}" page?`)) return;
        if (!beginOperation('deletePage')) {
            return;
        }

        try {
            await flushPendingSectionSave();
            const res = await api.del(`/cms/pages/${pageId}`);
            if (!res.success) {
                alert(res.error?.message || 'Failed to delete page');
                return;
            }

            if (selectedPageId === pageId) {
                setSelectedPageId(null);
                setSelectedSectionId(null);
                setShowSettings(false);
            }
            await loadPages();
            await loadInstanceUsage();
            await loadPublishReadiness();
        } finally {
            endOperation();
        }
    };

    // Add section
    const handleAddSection = async (theme: ThemeCatalogTheme) => {
        if (!selectedPageId) return;
        if (!beginOperation('addSection')) {
            return;
        }

        try {
            await flushPendingSectionSave();
            const res = await api.post<SectionData>(`/cms/pages/${selectedPageId}/sections`, { themeId: theme.id });
            if (res.success) {
                await loadSections();
                await loadPages();
                await loadPublishReadiness();
                return;
            }
            alert(res.error?.message || 'Failed to add this section.');
        } finally {
            endOperation();
        }
    };

    const handleReplaceSectionTheme = async (theme: ThemeCatalogTheme) => {
        const targetSectionId = themePickerTargetSectionId || selectedSectionId;
        if (!targetSectionId) {
            return;
        }

        const targetSection = sections.find((section) => section.id === targetSectionId);
        if (!targetSection || targetSection.theme.id === theme.id) {
            return;
        }

        if (!beginOperation('changeSectionTheme')) {
            return;
        }

        try {
            await flushPendingSectionSave();
            const res = await api.put<SectionData>(`/cms/sections/${targetSectionId}`, { themeId: theme.id });
            if (res.success) {
                setSectionDrafts((prevDrafts) => {
                    if (!prevDrafts[targetSectionId]) {
                        return prevDrafts;
                    }
                    const nextDrafts = { ...prevDrafts };
                    delete nextDrafts[targetSectionId];
                    return nextDrafts;
                });
                setSectionStyleDrafts((prevDrafts) => {
                    if (!prevDrafts[targetSectionId]) {
                        return prevDrafts;
                    }
                    const nextDrafts = { ...prevDrafts };
                    delete nextDrafts[targetSectionId];
                    return nextDrafts;
                });
                setSectionSaveState('idle');
                setSectionSaveError('');
                setSelectedSectionId(targetSectionId);
                await loadSections();
                await loadPublishReadiness();
                return;
            }
            alert(res.error?.message || 'Failed to update section theme.');
        } finally {
            endOperation();
        }
    };

    // Apply template
    const handleApplyTemplate = async (templateId: string) => {
        if (!selectedPageId) return;
        if (!beginOperation('applyTemplate')) {
            return;
        }

        try {
            await flushPendingSectionSave();
            setTemplatePickerOpen(false);
            let targetPageId = selectedPageId;
            let createdPageCount = 0;

            if (BLOG_TEMPLATE_IDS.has(templateId)) {
                const desiredBlogComponentKey = BLOG_SECTION_COMPONENT_KEY_BY_TEMPLATE[templateId] || 'blog/v15';
                const shouldReplaceSharedLayout = BLOG_TEMPLATE_FORCE_REPLACE_SHARED_LAYOUT_IDS.has(templateId);

                const homePageResult = await ensureBuilderPageBySlug({
                    pages,
                    aliases: HOME_PAGE_SLUG_ALIASES,
                    title: HOME_PAGE_TITLE,
                    slug: HOME_PAGE_SLUG,
                });

                if (!homePageResult.page) {
                    alert(homePageResult.errorMessage || 'Failed to resolve Home page');
                    return;
                }

                targetPageId = homePageResult.page.id;
                if (homePageResult.created) {
                    createdPageCount += 1;
                }

                // Apply Home first so fresh instances satisfy the API rule that non-home
                // pages can only be created after Home has at least one section.
                const homeApplyResult = await applyTemplateToPage({
                    pageId: homePageResult.page.id,
                    templateId,
                    replaceSharedLayoutContent: shouldReplaceSharedLayout,
                });
                if (!homeApplyResult.success) {
                    alert(homeApplyResult.errorMessage || 'Failed to apply template to Home');
                    return;
                }

                const latestPagesRes = await api.get<PageData[]>('/cms/pages');
                const latestPages = latestPagesRes.success && latestPagesRes.data
                    ? latestPagesRes.data
                    : pages;
                let workingPages = latestPages;

                const aboutPageResult = await ensureBuilderPageBySlug({
                    pages: workingPages,
                    aliases: ABOUT_PAGE_SLUG_ALIASES,
                    title: ABOUT_PAGE_TITLE,
                    slug: ABOUT_PAGE_SLUG,
                });
                if (!aboutPageResult.page) {
                    alert(aboutPageResult.errorMessage || 'Failed to resolve About page');
                    return;
                }
                if (aboutPageResult.created) {
                    createdPageCount += 1;
                    workingPages = [...workingPages, aboutPageResult.page];
                }

                const contactPageResult = await ensureBuilderPageBySlug({
                    pages: workingPages,
                    aliases: CONTACT_PAGE_SLUG_ALIASES,
                    title: CONTACT_PAGE_TITLE,
                    slug: CONTACT_PAGE_SLUG,
                });
                if (!contactPageResult.page) {
                    alert(contactPageResult.errorMessage || 'Failed to resolve Contact page');
                    return;
                }
                if (contactPageResult.created) {
                    createdPageCount += 1;
                    workingPages = [...workingPages, contactPageResult.page];
                }

                const blogPageResult = await ensureBuilderPageBySlug({
                    pages: workingPages,
                    aliases: BLOG_PAGE_SLUG_ALIASES,
                    title: BLOG_PAGE_TITLE,
                    slug: BLOG_PAGE_SLUG,
                });
                if (!blogPageResult.page) {
                    alert(blogPageResult.errorMessage || 'Failed to resolve Blog page');
                    return;
                }
                if (blogPageResult.created) {
                    createdPageCount += 1;
                    workingPages = [...workingPages, blogPageResult.page];
                }
                const blogPage = blogPageResult.page;

                const blogThemeResult = await resolveCatalogThemeByComponentKey({
                    featureId: BLOG_FEATURE_ID,
                    componentKey: desiredBlogComponentKey,
                });

                if (!blogThemeResult.theme) {
                    alert(blogThemeResult.errorMessage || 'Failed to resolve blog section theme');
                    return;
                }

                const stackComponentKeys = Array.from(new Set([
                    ...TRAIN_OF_THOUGHT_STACK.home,
                    ...TRAIN_OF_THOUGHT_STACK.about,
                    ...TRAIN_OF_THOUGHT_STACK.contact,
                    ...TRAIN_OF_THOUGHT_STACK.blog,
                ]));
                const themesByComponentKey: Record<string, ThemeCatalogTheme> = {
                    [desiredBlogComponentKey]: blogThemeResult.theme,
                };

                for (const componentKey of stackComponentKeys) {
                    if (themesByComponentKey[componentKey]) {
                        continue;
                    }

                    const featureSlug = getFeatureSlugFromComponentKey(componentKey);
                    const featureId = `feature-${featureSlug}`;

                    const resolvedThemeResult = await resolveCatalogThemeByComponentKey({
                        featureId,
                        componentKey,
                    });

                    if (!resolvedThemeResult.theme) {
                        alert(resolvedThemeResult.errorMessage || `Failed to resolve ${componentKey} theme`);
                        return;
                    }

                    themesByComponentKey[componentKey] = resolvedThemeResult.theme;
                }

                const homeNormalizeResult = await normalizePageSectionsToStack({
                    pageId: homePageResult.page.id,
                    desiredComponentKeys: TRAIN_OF_THOUGHT_STACK.home,
                    themesByComponentKey,
                    defaultContentByComponentKey: {
                        [desiredBlogComponentKey]: {
                            ...BLOG_SECTION_DEFAULT_CONTENT,
                            ctaLink: '/blog',
                        },
                    },
                });
                if (!homeNormalizeResult.success) {
                    alert(homeNormalizeResult.errorMessage || 'Failed to normalize Home page sections');
                    return;
                }

                const aboutApplyResult = await applyTemplateToPage({
                    pageId: aboutPageResult.page.id,
                    templateId,
                    replaceSharedLayoutContent: shouldReplaceSharedLayout,
                });
                if (!aboutApplyResult.success) {
                    alert(aboutApplyResult.errorMessage || 'Failed to apply template');
                    return;
                }

                const aboutNormalizeResult = await normalizePageSectionsToStack({
                    pageId: aboutPageResult.page.id,
                    desiredComponentKeys: TRAIN_OF_THOUGHT_STACK.about,
                    themesByComponentKey,
                });
                if (!aboutNormalizeResult.success) {
                    alert(aboutNormalizeResult.errorMessage || 'Failed to normalize About page sections');
                    return;
                }

                const contactApplyResult = await applyTemplateToPage({
                    pageId: contactPageResult.page.id,
                    templateId,
                    replaceSharedLayoutContent: shouldReplaceSharedLayout,
                });
                if (!contactApplyResult.success) {
                    alert(contactApplyResult.errorMessage || 'Failed to apply template');
                    return;
                }

                const contactNormalizeResult = await normalizePageSectionsToStack({
                    pageId: contactPageResult.page.id,
                    desiredComponentKeys: TRAIN_OF_THOUGHT_STACK.contact,
                    themesByComponentKey,
                });
                if (!contactNormalizeResult.success) {
                    alert(contactNormalizeResult.errorMessage || 'Failed to normalize Contact page sections');
                    return;
                }

                const applyResult = await applyTemplateToPage({
                    pageId: blogPage.id,
                    templateId,
                    replaceSharedLayoutContent: shouldReplaceSharedLayout,
                });
                if (!applyResult.success) {
                    alert(applyResult.errorMessage || 'Failed to apply template');
                    return;
                }

                const blogNormalizeResult = await normalizePageSectionsToStack({
                    pageId: blogPage.id,
                    desiredComponentKeys: TRAIN_OF_THOUGHT_STACK.blog,
                    themesByComponentKey,
                    defaultContentByComponentKey: {
                        [desiredBlogComponentKey]: {
                            ...BLOG_SECTION_DEFAULT_CONTENT,
                            ctaLink: '/blog',
                        },
                    },
                });
                if (!blogNormalizeResult.success) {
                    alert(blogNormalizeResult.errorMessage || 'Failed to normalize Blog page sections');
                    return;
                }
            } else {
                const applyResult = await applyTemplateToPage({ pageId: targetPageId, templateId });
                if (!applyResult.success) {
                    alert(applyResult.errorMessage || 'Failed to apply template');
                    return;
                }
            }

            setSelectedPageId(targetPageId);
            selectedPageIdRef.current = targetPageId;
            setSelectedSectionId(null);
            setShowSettings(false);

            await loadPages(targetPageId);
            const sectionsRes = await api.get<SectionData[]>(`/cms/pages/${targetPageId}/sections`);
            if (sectionsRes.success && sectionsRes.data) {
                setSections(sectionsRes.data);
            }

            if (createdPageCount > 0) {
                await loadInstanceUsage();
            }
            await loadSettings();
            await loadPublishReadiness();
        } finally {
            endOperation();
        }
    };

    // Delete section
    const handleDeleteSection = async (sectionId: string) => {
        if (!confirm('Remove this section?')) return;
        if (!beginOperation('deleteSection')) {
            return;
        }

        try {
            await flushPendingSectionSave();

            const previousSections = [...sections];
            // Optimistic delete
            setSections(sections.filter(s => s.id !== sectionId));
            if (selectedSectionId === sectionId) setSelectedSectionId(null);

            try {
                const res = await api.del(`/cms/sections/${sectionId}`);
                if (!res.success) {
                    throw new Error(res.error?.message || 'Failed to delete section');
                }
                await loadSections();
                await loadPages();
                await loadPublishReadiness();
            } catch (error) {
                console.error('Failed to delete section', error);
                setSections(previousSections);
                alert('Failed to delete section');
            }
        } finally {
            endOperation();
        }
    };

    // Move section
    const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
        const idx = sections.findIndex((s) => s.id === sectionId);
        if (idx < 0) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sections.length) return;
        if (!beginOperation('moveSection')) {
            return;
        }

        try {
            await flushPendingSectionSave();

            const previousSections = [...sections];

            const reorderedPayload = sections.map((s, i) => ({
                id: s.id,
                position: i === idx ? sections[swapIdx]!.position : i === swapIdx ? sections[idx]!.position : s.position,
            }));

            // Optimistic UI sorting locally
            const updatedSections = [...sections];
            const temp = { ...updatedSections[idx]! };
            updatedSections[idx] = { ...updatedSections[swapIdx]!, position: reorderedPayload.find(r => r.id === updatedSections[swapIdx]!.id)!.position };
            updatedSections[swapIdx] = { ...temp, position: reorderedPayload.find(r => r.id === temp.id)!.position };

            setSections(updatedSections.sort((a, b) => a.position - b.position));

            try {
                await api.put(`/cms/pages/${selectedPageId}/sections/reorder`, { sections: reorderedPayload });
                await loadSections();
            } catch (error) {
                console.error('Failed to move section', error);
                setSections(previousSections);
                alert('Failed to move section');
            }
        } finally {
            endOperation();
        }
    };

    // Publish
    const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN || 'buildmyonlineweb.site';
    const fallbackLiveSiteUrl = currentInstance?.subdomain
        ? `https://${currentInstance.subdomain}.${siteDomain}`
        : null;
    const liveSiteUrl = currentInstance?.customDomain
        ? `https://${currentInstance.customDomain}`
        : fallbackLiveSiteUrl;

    const resolveLiveSiteUrl = async (): Promise<string | null> => {
        return liveSiteUrl;
    };

    const handlePublish = async () => {
        if (publishBlockedByPlan) {
            alert(publishReadiness?.message || 'This website cannot be published on the current plan.');
            return;
        }
        if (!beginOperation('publish')) {
            return;
        }

        try {
            await flushPendingSectionSave();
            setPublishing(true);
            const res = await api.post<{ version: number }>('/cms/builder/publish');
            if (res.success && res.data) {
                const liveSiteUrl = await resolveLiveSiteUrl();
                if (liveSiteUrl) {
                    window.open(liveSiteUrl, '_blank', 'noreferrer');
                }
            } else {
                alert(res.error?.message || 'Publish failed. Please try again.');
                await loadPublishReadiness();
            }
        } finally {
            setPublishing(false);
            endOperation();
        }
    };

    // Save settings
    const handleSaveSettings = async (newSettings: Partial<WebsiteSettings>) => {
        await flushPendingSectionSave();
        setSettingsSaving(true);
        const res = await api.put<{ settings: WebsiteSettings }>('/cms/builder/settings', newSettings);
        if (res.success && res.data) {
            setSettings(res.data.settings);
        }
        setSettingsSaving(false);
    };

    const handleSavePageSeo = async (pageId: string, seoJsonb: SEOData | null): Promise<{ success: boolean; message?: string }> => {
        await flushPendingSectionSave();
        const res = await api.put<PageData>(`/cms/pages/${pageId}`, { seoJsonb });
        if (!res.success) {
            return {
                success: false,
                message: res.error?.message || 'Failed to save page metadata.',
            };
        }

        await loadPages(pageId);
        await loadPublishReadiness();
        return { success: true };
    };

    if (!currentInstance) {
        return (
            <div className="be-card flex min-h-[320px] items-center justify-center p-6">
                <div className="space-y-4 text-center">
                    <p className="text-sm text-slate-500">
                        {currentTenant
                            ? 'Select a website to start building.'
                            : 'Create an organization first to start building.'}
                    </p>
                    <p className="text-xs text-slate-400">
                        Instance means one website. Each connected custom domain points to one website.
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push(currentTenant ? '/dashboard/instances/new' : '/onboarding/create-organization?domainMode=subdomain')}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
                    >
                        <Plus className="h-4 w-4" />
                        {currentTenant ? 'Create Website' : 'Create Organization'}
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="be-card flex min-h-[320px] items-center justify-center p-6">
                <p className="text-sm text-slate-500">Loading builder...</p>
            </div>
        );
    }

    return (
        <div className="relative flex h-full overflow-hidden rounded-none border-y border-[#2563eb]/10 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <aside className={`${isLeftPanelOpen ? 'w-72' : 'w-14'} flex shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-slate-900`}>
                <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-700">
                    {isLeftPanelOpen && <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Builder</h2>}
                    <button
                        type="button"
                        onClick={() => setIsLeftPanelOpen((prev) => !prev)}
                        className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#2563eb] dark:hover:bg-slate-800"
                        title={isLeftPanelOpen ? 'Collapse left panel' : 'Expand left panel'}
                    >
                        {isLeftPanelOpen ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
                    </button>
                </div>

                {isLeftPanelOpen ? (
                    <>
                        <div className="border-b border-slate-200 p-4 dark:border-slate-700">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pages</h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isOperationInProgress) {
                                            return;
                                        }
                                        setShowNewPage(true);
                                    }}
                                    disabled={isOperationInProgress || !canCreatePages}
                                    className="rounded-md p-1 text-[#2563eb] transition-colors hover:bg-[#2563eb]/10 disabled:cursor-not-allowed disabled:opacity-40"
                                    title={
                                        pageLimitReached
                                            ? 'Page limit reached for this plan'
                                            : 'Create page'
                                    }
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            {showNewPage && (
                                <div className="mb-3 space-y-2">
                                    <input
                                        type="text"
                                        value={newPageTitle}
                                        onChange={(e) => setNewPageTitle(e.target.value)}
                                        placeholder="Page title (About, Team, Services...)"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                void handleCreatePage();
                                            }
                                        }}
                                        autoFocus
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        {PAGE_TITLE_SUGGESTIONS.map((suggestedTitle) => (
                                            <button
                                                key={suggestedTitle}
                                                type="button"
                                                onClick={() => setNewPageTitle(suggestedTitle)}
                                                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-[#2563eb]/40 hover:text-[#2563eb] dark:border-slate-700 dark:text-slate-300"
                                            >
                                                {suggestedTitle}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCreatePage}
                                            disabled={!canCreatePages || isOperationInProgress}
                                            className="rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
                                        >
                                            {pageLimitReached
                                                ? 'Page Limit Reached'
                                                : isCreatingPage
                                                    ? 'Creating...'
                                                    : 'Add Page'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowNewPage(false);
                                                setNewPageTitle('');
                                            }}
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                {pageLimitReached && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                                        Page creation disabled on the current plan.
                                    </div>
                                )}
                                {pages.length === 0 && !showNewPage && (
                                    <div className="space-y-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                                        <p className="text-xs text-slate-600 dark:text-slate-300">
                                            No pages yet. Create a Home page to start and then apply a template.
                                        </p>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { void handleCreateHomePage(); }}
                                                disabled={!canCreatePages || isOperationInProgress}
                                                className="rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                Create Home Page
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPage(true)}
                                                disabled={!canCreatePages || isOperationInProgress}
                                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                            >
                                                Create Custom Page
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {pages.map((page) => {
                                    const active = selectedPageId === page.id;
                                    const isHomePage = page.slug === '/';
                                    const isSwitchingToThisPage = pageSwitching && pageSwitchingTargetId === page.id;

                                    return (
                                        <div
                                            key={page.id}
                                            className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors ${
                                                active
                                                    ? 'border-[#2563eb]/30 bg-[#2563eb]/10 text-[#2563eb]'
                                                    : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => { void handleSelectPage(page.id); }}
                                                disabled={pageSwitching || isOperationInProgress}
                                                className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold">
                                                        {isHomePage ? 'Home' : page.title}
                                                    </p>
                                                    <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                        {isHomePage ? '/' : `/${page.slug}`}
                                                    </p>
                                                </div>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${active ? 'bg-[#2563eb]/20 text-[#2563eb]' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                    {isSwitchingToThisPage ? (
                                                        <span className="inline-flex h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
                                                    ) : (
                                                        page.sectionCount
                                                    )}
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeletePage(page.id)}
                                                disabled={isOperationInProgress}
                                                className={`rounded-md p-1 transition-colors ${
                                                    active ? 'text-[#2563eb] hover:bg-[#2563eb]/15' : 'text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-700'
                                                }`}
                                                title="Delete page"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Sections</h3>
                                <button
                                    type="button"
                                    onClick={openAddSectionThemePicker}
                                    disabled={!selectedPageId || isOperationInProgress}
                                    className="rounded-md p-1 text-[#2563eb] transition-colors hover:bg-[#2563eb]/10 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Add section"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {!selectedPageId ? (
                                    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                        Create or select a page to add sections.
                                    </div>
                                ) : sections.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                        No sections yet for this page.
                                    </div>
                                ) : (
                                    sections.map((section, idx) => {
                                        const active = section.id === selectedSectionId;
                                        return (
                                            <div
                                                key={section.id}
                                                className={`rounded-xl border p-2 transition-colors ${
                                                    active
                                                        ? 'border-[#2563eb]/30 bg-[#2563eb]/10'
                                                        : 'border-slate-200 bg-slate-50 hover:border-[#2563eb]/20 hover:bg-[#2563eb]/5 dark:border-slate-700 dark:bg-slate-800'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openSectionInspector(section.id)}
                                                        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left"
                                                    >
                                                        <GripVertical className={`h-4 w-4 shrink-0 ${active ? 'text-[#2563eb]' : 'text-slate-400'}`} />
                                                        <FileText className={`h-4 w-4 shrink-0 ${active ? 'text-[#2563eb]' : 'text-slate-400'}`} />
                                                        <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                                                            {section.theme.name}
                                                        </span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveSection(section.id, 'up')}
                                                        disabled={idx === 0}
                                                        className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                                                        title="Move up"
                                                    >
                                                        <ChevronUp className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveSection(section.id, 'down')}
                                                        disabled={idx === sections.length - 1}
                                                        className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                                                        title="Move down"
                                                    >
                                                        <ChevronDown className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 border-t border-slate-200 p-4 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={openWebsiteSettingsInspector}
                                disabled={isOperationInProgress}
                                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                    showSettings
                                        ? 'bg-[#2563eb] text-white'
                                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Settings2 className="h-4 w-4" />
                                Website Settings
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedPageId) {
                                        setTemplatePickerOpen(true);
                                        return;
                                    }
                                    void handleCreateHomePage();
                                }}
                                disabled={isOperationInProgress || (!selectedPageId && !canCreatePages)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <LayoutTemplate className="h-4 w-4" />
                                {selectedPageId ? 'Apply Template' : 'Create Home + Template'}
                            </button>
                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={publishing || publishBlockedByPlan || isOperationInProgress}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-semibold text-white shadow-md shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Upload className="h-4 w-4" />
                                {publishing ? 'Publishing...' : publishBlockedByPlan ? 'Publish Blocked' : 'Publish Website'}
                            </button>
                            {publishBlockedByPlan && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                                    {publishReadiness?.message || 'This website cannot be published right now.'}
                                </div>
                            )}
                            {liveSiteUrl && (
                                <a
                                    href={liveSiteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    View Live Site
                                </a>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center gap-3 p-2">
                        <button
                            type="button"
                            onClick={() => setIsLeftPanelOpen(true)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Expand left panel"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={openAddSectionThemePicker}
                            disabled={isOperationInProgress || !selectedPageId}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Add section"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={openWebsiteSettingsInspector}
                            disabled={isOperationInProgress}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Website settings"
                        >
                            <Settings2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </aside>

            <section className="min-w-0 flex flex-1 flex-col overflow-hidden bg-[#f6f6f8] dark:bg-[#121121]">
                <div className="border-b border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">Editing Page</p>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedPage?.title || 'Select a Page'}</h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode('desktop')}
                                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                                        previewMode === 'desktop'
                                            ? 'bg-[#2563eb] text-white'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                    }`}
                                    title="Desktop preview"
                                >
                                    <Monitor className="h-3.5 w-3.5" />
                                    Web
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode('mobile')}
                                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                                        previewMode === 'mobile'
                                            ? 'bg-[#2563eb] text-white'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                    }`}
                                    title="Mobile preview"
                                >
                                    <Smartphone className="h-3.5 w-3.5" />
                                    Mobile
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedPageId) {
                                        setTemplatePickerOpen(true);
                                        return;
                                    }
                                    void handleCreateHomePage();
                                }}
                                disabled={isOperationInProgress || (!selectedPageId && !canCreatePages)}
                                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                {selectedPageId ? 'Use Template' : 'Create Home + Template'}
                            </button>
                            <button
                                type="button"
                                onClick={openAddSectionThemePicker}
                                disabled={!selectedPageId || isOperationInProgress}
                                className="rounded-md bg-[#2563eb] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Add Section
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsRightPanelOpen((prev) => !prev)}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <Settings2 className="h-3.5 w-3.5" />
                                {isRightPanelOpen ? 'Hide Inspector' : 'Show Inspector'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className={`relative mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-700 dark:bg-slate-900 ${previewMode === 'mobile' ? 'max-w-[430px]' : 'w-full'}`}>
                        {pageSwitching && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/75 backdrop-blur-sm dark:bg-slate-900/75">
                                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    <span className="inline-flex h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Loading page...
                                </div>
                            </div>
                        )}
                        {!selectedPageId && (
                            <div className="px-6 py-20 text-center">
                                <p className="mb-2 text-base text-slate-600 dark:text-slate-300">
                                    {pages.length === 0
                                        ? 'No pages found for this website.'
                                        : 'Select a page to start editing.'}
                                </p>
                                {pages.length === 0 && (
                                    <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                                        Create a Home page first, then apply a template and start customizing sections.
                                    </p>
                                )}
                                {pages.length === 0 && (
                                    <div className="flex flex-wrap justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { void handleCreateHomePage(); }}
                                            disabled={!canCreatePages || isOperationInProgress}
                                            className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            Create Home Page
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPage(true)}
                                            disabled={!canCreatePages || isOperationInProgress}
                                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            Create Custom Page
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {sections.length === 0 && selectedPageId && (
                            <div className="px-6 py-20 text-center">
                                <p className="mb-4 text-base text-slate-500 dark:text-slate-400">This page has no sections yet.</p>
                                <div className="flex flex-wrap justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setTemplatePickerOpen(true)}
                                        disabled={isOperationInProgress}
                                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                        Choose Template
                                    </button>
                                    <button
                                        type="button"
                                        onClick={openAddSectionThemePicker}
                                        disabled={isOperationInProgress}
                                        className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
                                    >
                                        Add First Section
                                    </button>
                                </div>
                            </div>
                        )}

                        {sections.map((section, idx) => (
                            <div
                                key={section.id}
                                className={`group relative cursor-pointer outline outline-2 transition-all ${
                                    selectedSectionId === section.id
                                        ? 'outline-[#2563eb] ring-2 ring-[#2563eb]/20'
                                        : 'outline-transparent hover:outline-[#2563eb]/35'
                                }`}
                                onClick={() => openSectionInspector(section.id)}
                            >
                                <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md bg-white/95 p-1 shadow-sm dark:bg-slate-900/90">
                                    <span className="rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                                        {section.theme.name}
                                    </span>
                                    {idx > 0 && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMoveSection(section.id, 'up');
                                            }}
                                            disabled={isOperationInProgress}
                                            className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                                            title="Move up"
                                        >
                                            <ChevronUp className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                    {idx < sections.length - 1 && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMoveSection(section.id, 'down');
                                            }}
                                            disabled={isOperationInProgress}
                                            className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                                            title="Move down"
                                        >
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSection(section.id);
                                        }}
                                        disabled={isOperationInProgress}
                                        className="rounded p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                                        title="Delete section"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                <SectionRenderer
                                    componentKey={section.theme.componentKey}
                                    content={section.contentJsonb}
                                    styles={section.stylesJsonb}
                                    tokens={tokens}
                                    isEditor
                                    context={currentTenant && currentInstance ? {
                                        tenantId: currentTenant.id,
                                        instanceId: currentInstance.id,
                                        pageSlug: selectedPage?.slug,
                                        subdomain: currentInstance.subdomain,
                                    } : undefined}
                                />
                            </div>
                        ))}

                        {sections.length > 0 && (
                            <div className="border-t border-dashed border-slate-200 px-6 py-8 text-center dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={openAddSectionThemePicker}
                                    disabled={isOperationInProgress}
                                    className="rounded-lg border-2 border-dashed border-[#2563eb]/40 bg-[#2563eb]/5 px-5 py-2 text-sm font-semibold text-[#2563eb] transition hover:bg-[#2563eb]/10"
                                >
                                    Add New Section
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <aside className={`${isRightPanelOpen ? 'w-80 border-l' : 'w-0 border-l-0'} flex shrink-0 flex-col overflow-hidden bg-white transition-all duration-300 dark:bg-slate-900 ${isRightPanelOpen ? 'border-slate-200 dark:border-slate-700' : ''}`}>
                {isRightPanelOpen && (
                    <>
                        <div className="border-b border-slate-200 p-4 dark:border-slate-700">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        {showSettings ? 'Website Settings' : selectedSection ? `${selectedSection.theme.name} Settings` : 'Section Inspector'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {showSettings
                                            ? 'Edit global theme, colors, and typography.'
                                            : selectedSection
                                                ? selectedSection.theme.componentKey
                                                : 'Select a section from canvas or list to edit.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsRightPanelOpen(false)}
                                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    title="Close inspector"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowSettings(false)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                        !showSettings
                                            ? 'bg-white text-[#2563eb] shadow-sm dark:bg-slate-700'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    Section
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowSettings(true)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                        showSettings
                                            ? 'bg-white text-[#2563eb] shadow-sm dark:bg-slate-700'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    Website
                                </button>
                            </div>

                            {!showSettings && selectedSection && (
                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openReplaceSectionThemePicker(selectedSection.id)}
                                        disabled={isOperationInProgress}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <LayoutTemplate className="h-3.5 w-3.5" />
                                        Change Theme
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleMoveSection(selectedSection.id, 'up')}
                                        disabled={selectedSectionIndex <= 0 || isOperationInProgress}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <ChevronUp className="h-3.5 w-3.5" />
                                        Up
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleMoveSection(selectedSection.id, 'down')}
                                        disabled={selectedSectionIndex >= sections.length - 1 || isOperationInProgress}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <ChevronDown className="h-3.5 w-3.5" />
                                        Down
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteSection(selectedSection.id)}
                                        disabled={isOperationInProgress}
                                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                    </button>
                                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                        <Eye className="h-3.5 w-3.5" />
                                        Visible
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {showSettings ? (
                                <SettingsPanel
                                    settings={settings}
                                    pages={pages}
                                    onSave={handleSaveSettings}
                                    onSavePageSeo={handleSavePageSeo}
                                    saving={settingsSaving}
                                    initialTab={requestedWebsiteSettingsTab}
                                />
                            ) : selectedSection ? (
                                <div className="p-4">
                                    {sectionSaveState !== 'idle' && (
                                        <div
                                            className={`mb-3 rounded-md border px-3 py-2 text-xs ${
                                                sectionSaveState === 'error'
                                                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'
                                                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300'
                                            }`}
                                        >
                                            {sectionSaveState === 'pending' && 'Typing... changes will auto-save shortly.'}
                                            {sectionSaveState === 'saving' && 'Saving changes...'}
                                            {sectionSaveState === 'saved' && 'All changes saved.'}
                                            {sectionSaveState === 'error' && (sectionSaveError || 'Failed to save changes.')}
                                        </div>
                                    )}
                                    <SchemaForm
                                        schema={selectedSectionSchema as React.ComponentProps<typeof SchemaForm>['schema']}
                                        values={selectedSectionValues}
                                        onChange={(values) => handleSectionDraftChange(selectedSection.id, values)}
                                        pages={pages}
                                    />
                                    <SectionAppearanceControls
                                        values={selectedSectionStyleValues as Record<string, unknown>}
                                        onChange={(values) => handleSectionStyleDraftChange(selectedSection.id, values)}
                                    />
                                </div>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                                    <div className="mb-3 rounded-full bg-[#2563eb]/10 p-3 text-[#2563eb]">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No section selected</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Choose a section on the left list or canvas to edit content fields.
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </aside>

            {isOperationInProgress && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-[1px] dark:bg-slate-900/70">
                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {activeOperationMessage}
                    </div>
                </div>
            )}

            <ThemePicker
                open={themePickerOpen}
                onClose={closeThemePicker}
                onSelect={(theme) => {
                    if (themePickerMode === 'replace') {
                        void handleReplaceSectionTheme(theme);
                        return;
                    }
                    void handleAddSection(theme);
                }}
                disallowedComponentKeys={existingGlobalLayoutKeys}
                disallowedFeatureSlugs={existingGlobalLayoutFeatureSlugs}
                mode={themePickerMode}
                replaceTarget={themePickerTargetSection ? {
                    sectionId: themePickerTargetSection.id,
                    themeId: themePickerTargetSection.theme.id,
                    featureSlug: themePickerTargetSection.theme.feature?.slug,
                    featureName: themePickerTargetSection.theme.feature?.name,
                } : null}
            />
            <TemplatePicker open={templatePickerOpen} onClose={() => setTemplatePickerOpen(false)} onSelect={handleApplyTemplate} />
        </div>
    );
}

function normalizeHexColorInput(value: string): string | null {
    const trimmed = value.trim();
    const threeDigit = /^#[0-9a-fA-F]{3}$/;
    const sixDigit = /^#[0-9a-fA-F]{6}$/;

    if (threeDigit.test(trimmed)) {
        const chars = trimmed.slice(1).split('');
        return `#${chars.map((char) => `${char}${char}`).join('')}`.toLowerCase();
    }

    if (sixDigit.test(trimmed)) {
        return trimmed.toLowerCase();
    }

    return null;
}

function toSectionColorPickerValue(value: string): string {
    return normalizeHexColorInput(value) || '#000000';
}

function readStyleColorValue(values: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
        const candidate = values[key];
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
            return candidate.trim();
        }
    }
    return '';
}

function SectionAppearanceControls({ values, onChange }: {
    values: Record<string, unknown>;
    onChange: (values: Record<string, unknown>) => void;
}) {
    const backgroundAliases = ['sectionBackgroundColor', 'backgroundColor', 'bgColor'];
    const textAliases = ['sectionTextColor', 'textColor', 'foregroundColor', 'color'];
    const primaryButtonBackgroundAliases = ['primaryButtonBackgroundColor', 'primaryButtonColor', 'buttonColor'];
    const primaryButtonTextAliases = ['primaryButtonTextColor', 'buttonTextColor'];
    const secondaryButtonBackgroundAliases = ['secondaryButtonBackgroundColor', 'secondaryButtonColor'];
    const secondaryButtonTextAliases = ['secondaryButtonTextColor', 'secondaryButtonLabelColor'];

    const backgroundColor = readStyleColorValue(values, backgroundAliases);
    const textColor = readStyleColorValue(values, textAliases);
    const primaryButtonBackgroundColor = readStyleColorValue(values, primaryButtonBackgroundAliases);
    const primaryButtonTextColor = readStyleColorValue(values, primaryButtonTextAliases);
    const secondaryButtonBackgroundColor = readStyleColorValue(values, secondaryButtonBackgroundAliases);
    const secondaryButtonTextColor = readStyleColorValue(values, secondaryButtonTextAliases);
    const autoTextContrast = (values.autoTextContrast as boolean | undefined) !== false;
    const colorInputStyle: React.CSSProperties = {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid var(--be-form-border, #cbd5e1)',
        borderRadius: '6px',
        fontSize: '14px',
        boxSizing: 'border-box',
        backgroundColor: 'var(--be-form-bg, #ffffff)',
        color: 'var(--be-form-text, #0f172a)',
    };
    const resetButtonStyle: React.CSSProperties = {
        padding: '6px 10px',
        backgroundColor: 'var(--be-form-surface, #f8fafc)',
        color: 'var(--be-form-label, #475569)',
        border: '1px solid var(--be-form-border, #cbd5e1)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 500,
    };

    const updateColor = (aliases: string[], value: string) => {
        const next = { ...values };
        aliases.forEach((alias) => { delete next[alias]; });

        const trimmed = value.trim();
        if (trimmed.length > 0) {
            next[aliases[0]!] = trimmed;
        }

        onChange(next);
    };

    const clearColor = (aliases: string[]) => {
        const next = { ...values };
        aliases.forEach((alias) => { delete next[alias]; });
        onChange(next);
    };

    return (
        <div style={{
            marginTop: '18px',
            borderTop: '1px solid var(--be-form-border, #e2e8f0)',
            paddingTop: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
        }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--be-form-heading, #0f172a)' }}>
                Section Appearance
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--be-form-muted, #64748b)' }}>
                Override this section text, background, and button colors without changing the whole website theme.
            </p>

            <div style={{ display: 'grid', gap: '10px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--be-form-label, #475569)' }}>Background Color</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="color"
                            value={toSectionColorPickerValue(backgroundColor)}
                            onChange={(event) => updateColor(backgroundAliases, event.target.value)}
                            style={{ width: '40px', height: '32px', padding: 0, border: 'none', background: 'transparent' }}
                        />
                        <input
                            type="text"
                            value={backgroundColor}
                            onChange={(event) => updateColor(backgroundAliases, event.target.value)}
                            placeholder="#0b1121"
                            style={colorInputStyle}
                        />
                        <button
                            type="button"
                            onClick={() => clearColor(backgroundAliases)}
                            style={resetButtonStyle}
                        >
                            Reset
                        </button>
                    </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--be-form-label, #475569)' }}>Text Color</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="color"
                            value={toSectionColorPickerValue(textColor)}
                            onChange={(event) => updateColor(textAliases, event.target.value)}
                            style={{ width: '40px', height: '32px', padding: 0, border: 'none', background: 'transparent' }}
                        />
                        <input
                            type="text"
                            value={textColor}
                            onChange={(event) => updateColor(textAliases, event.target.value)}
                            placeholder="#f8fafc"
                            style={colorInputStyle}
                        />
                        <button
                            type="button"
                            onClick={() => clearColor(textAliases)}
                            style={resetButtonStyle}
                        >
                            Reset
                        </button>
                    </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--be-form-label, #475569)' }}>
                    <input
                        type="checkbox"
                        checked={autoTextContrast}
                        onChange={(event) => onChange({
                            ...values,
                            autoTextContrast: event.target.checked,
                        })}
                        style={{ width: '14px', height: '14px' }}
                    />
                    Auto-pick readable text color when only background is set
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--be-form-label, #475569)' }}>Primary Button Background</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="color"
                            value={toSectionColorPickerValue(primaryButtonBackgroundColor)}
                            onChange={(event) => updateColor(primaryButtonBackgroundAliases, event.target.value)}
                            style={{ width: '40px', height: '32px', padding: 0, border: 'none', background: 'transparent' }}
                        />
                        <input
                            type="text"
                            value={primaryButtonBackgroundColor}
                            onChange={(event) => updateColor(primaryButtonBackgroundAliases, event.target.value)}
                            placeholder="#1f160f"
                            style={colorInputStyle}
                        />
                        <button type="button" onClick={() => clearColor(primaryButtonBackgroundAliases)} style={resetButtonStyle}>
                            Reset
                        </button>
                    </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--be-form-label, #475569)' }}>Primary Button Text</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="color"
                            value={toSectionColorPickerValue(primaryButtonTextColor)}
                            onChange={(event) => updateColor(primaryButtonTextAliases, event.target.value)}
                            style={{ width: '40px', height: '32px', padding: 0, border: 'none', background: 'transparent' }}
                        />
                        <input
                            type="text"
                            value={primaryButtonTextColor}
                            onChange={(event) => updateColor(primaryButtonTextAliases, event.target.value)}
                            placeholder="#ffffff"
                            style={colorInputStyle}
                        />
                        <button type="button" onClick={() => clearColor(primaryButtonTextAliases)} style={resetButtonStyle}>
                            Reset
                        </button>
                    </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--be-form-label, #475569)' }}>Secondary Button Background</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="color"
                            value={toSectionColorPickerValue(secondaryButtonBackgroundColor)}
                            onChange={(event) => updateColor(secondaryButtonBackgroundAliases, event.target.value)}
                            style={{ width: '40px', height: '32px', padding: 0, border: 'none', background: 'transparent' }}
                        />
                        <input
                            type="text"
                            value={secondaryButtonBackgroundColor}
                            onChange={(event) => updateColor(secondaryButtonBackgroundAliases, event.target.value)}
                            placeholder="#fffaf2"
                            style={colorInputStyle}
                        />
                        <button type="button" onClick={() => clearColor(secondaryButtonBackgroundAliases)} style={resetButtonStyle}>
                            Reset
                        </button>
                    </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--be-form-label, #475569)' }}>Secondary Button Text</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="color"
                            value={toSectionColorPickerValue(secondaryButtonTextColor)}
                            onChange={(event) => updateColor(secondaryButtonTextAliases, event.target.value)}
                            style={{ width: '40px', height: '32px', padding: 0, border: 'none', background: 'transparent' }}
                        />
                        <input
                            type="text"
                            value={secondaryButtonTextColor}
                            onChange={(event) => updateColor(secondaryButtonTextAliases, event.target.value)}
                            placeholder="#1f160f"
                            style={colorInputStyle}
                        />
                        <button type="button" onClick={() => clearColor(secondaryButtonTextAliases)} style={resetButtonStyle}>
                            Reset
                        </button>
                    </div>
                </label>
            </div>
        </div>
    );
}

// ============================================================
// Settings Panel (Theme Templates + Font Suggestions)
// ============================================================

type ColorTokenKey = Exclude<keyof WebsiteSettings['tokens'], 'font'>;

interface ThemeTemplate {
    id: string;
    name: string;
    description: string;
    tokens: Record<ColorTokenKey, string>;
    recommendedFont: string;
    fontSuggestions: string[];
}

const THEME_TEMPLATES: ThemeTemplate[] = [
    {
        id: 'ocean-breeze',
        name: 'Ocean Breeze',
        description: 'Fresh blue-green palette for clean, modern brands.',
        tokens: {
            primary: '#2563eb',
            secondary: '#0d9488',
            accent: '#f59e0b',
            text: '#0f172a',
            background: '#f8fafc',
        },
        recommendedFont: 'Poppins',
        fontSuggestions: ['Poppins', 'Inter', 'Manrope'],
    },
    {
        id: 'sunset-warm',
        name: 'Sunset Warm',
        description: 'Warm, welcoming palette for beauty and hospitality.',
        tokens: {
            primary: '#c2410c',
            secondary: '#be123c',
            accent: '#f59e0b',
            text: '#3f2a1d',
            background: '#fff7ed',
        },
        recommendedFont: 'Nunito',
        fontSuggestions: ['Nunito', 'Poppins', 'Montserrat'],
    },
    {
        id: 'forest-calm',
        name: 'Forest Calm',
        description: 'Natural greens for wellness, clinics, and lifestyle.',
        tokens: {
            primary: '#059669',
            secondary: '#0891b2',
            accent: '#f97316',
            text: '#1f2937',
            background: '#f0fdf4',
        },
        recommendedFont: 'Lato',
        fontSuggestions: ['Lato', 'Inter', 'Merriweather'],
    },
    {
        id: 'slate-minimal',
        name: 'Slate Minimal',
        description: 'Neutral, high-contrast palette for professional sites.',
        tokens: {
            primary: '#111827',
            secondary: '#475569',
            accent: '#3b82f6',
            text: '#0f172a',
            background: '#f8fafc',
        },
        recommendedFont: 'DM Sans',
        fontSuggestions: ['DM Sans', 'Inter', 'Roboto'],
    },
];

const COLOR_INPUT_ORDER: ColorTokenKey[] = ['text', 'accent', 'primary', 'secondary', 'background'];
const TEMPLATE_SWATCH_ORDER: ColorTokenKey[] = ['primary', 'secondary', 'accent', 'text', 'background'];
const DEFAULT_FONT_SUGGESTIONS = ['Inter', 'Poppins', 'Manrope', 'Roboto', 'Lora'];

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--be-form-border, #cbd5e1)',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: 'var(--be-form-bg, #ffffff)',
    color: 'var(--be-form-text, #0f172a)',
};
const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--be-form-label, #475569)',
    marginBottom: '4px',
};
const sectionTitleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--be-form-heading, #0f172a)',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--be-form-border, #cbd5e1)',
};
const actionBtnStyle: React.CSSProperties = {
    padding: '6px 10px',
    backgroundColor: 'var(--be-form-surface, #f8fafc)',
    color: 'var(--be-form-label, #475569)',
    border: '1px solid var(--be-form-border, #cbd5e1)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
};

function normalizeHex(value: string): string {
    return value.trim().toLowerCase();
}

function findMatchingTemplateId(tokens: WebsiteSettings['tokens']): string | null {
    const match = THEME_TEMPLATES.find((template) =>
        COLOR_INPUT_ORDER.every((key) => normalizeHex(tokens[key]) === normalizeHex(template.tokens[key])),
    );
    return match?.id || null;
}

function toColorInputValue(value: string): string {
    return /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value : '#000000';
}

function normalizeNullableString(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function cloneSeoData(value: SEOData | null | undefined): SEOData {
    if (!value) return {};
    return { ...value };
}

function cloneSeoBusiness(value: WebsiteSEOBusiness | null | undefined): WebsiteSEOBusiness {
    if (!value) return { businessType: 'Organization', sameAs: [] };
    return {
        ...value,
        sameAs: Array.isArray(value.sameAs) ? [...value.sameAs] : value.sameAs || [],
    };
}

function cloneSeoSettings(value: WebsiteSEOSettings | null | undefined): WebsiteSEOSettings {
    if (!value) {
        return {
            siteName: '',
            defaults: { robotsIndex: true, robotsFollow: true, twitterCard: 'summary_large_image' },
            business: { businessType: 'Organization', sameAs: [] },
        };
    }

    return {
        siteName: value.siteName ?? '',
        defaults: cloneSeoData(value.defaults),
        business: cloneSeoBusiness(value.business),
    };
}

function SettingsPanel({ settings, pages, onSave, onSavePageSeo, saving, initialTab }: {
    settings: WebsiteSettings | null;
    pages: PageData[];
    onSave: (settings: Partial<WebsiteSettings>) => void;
    onSavePageSeo: (pageId: string, seoJsonb: SEOData | null) => Promise<{ success: boolean; message?: string }>;
    saving: boolean;
    initialTab?: string | null;
}) {
    const [tokens, setTokens] = useState<WebsiteSettings['tokens']>(settings?.tokens || DEFAULT_TOKENS);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(findMatchingTemplateId(settings?.tokens || DEFAULT_TOKENS));
    const [websiteSettingsTab, setWebsiteSettingsTab] = useState<'themes' | 'metadata' | 'code'>(
        initialTab === 'metadata' || initialTab === 'code' ? initialTab : 'themes',
    );
    const [seoMode, setSeoMode] = useState<'website' | 'page'>('website');
    const [seoSettings, setSeoSettings] = useState<WebsiteSEOSettings>(cloneSeoSettings(settings?.seo));
    const [selectedSeoPageId, setSelectedSeoPageId] = useState<string>(pages[0]?.id || '');
    const [pageSeoDraft, setPageSeoDraft] = useState<SEOData | null>(pages[0]?.seoJsonb ? cloneSeoData(pages[0].seoJsonb) : null);
    const [pageSeoSaving, setPageSeoSaving] = useState(false);
    const [pageSeoMessage, setPageSeoMessage] = useState<string | null>(null);
    const [customCode, setCustomCode] = useState<WebsiteCustomCodeSettings>(settings?.customCode || {});

    useEffect(() => {
        if (!settings?.tokens) return;
        setTokens(settings.tokens);
        setSelectedTemplateId(findMatchingTemplateId(settings.tokens));
    }, [settings?.tokens]);

    useEffect(() => {
        setSeoSettings(cloneSeoSettings(settings?.seo));
    }, [settings?.seo]);

    useEffect(() => {
        if (pages.length === 0) {
            setSelectedSeoPageId('');
            setPageSeoDraft(null);
            return;
        }

        setSelectedSeoPageId((current) => {
            if (current && pages.some((page) => page.id === current)) {
                return current;
            }
            return pages[0]!.id;
        });
    }, [pages]);

    useEffect(() => {
        if (!selectedSeoPageId) {
            setPageSeoDraft(null);
            return;
        }
        const page = pages.find((entry) => entry.id === selectedSeoPageId);
        setPageSeoDraft(page?.seoJsonb ? cloneSeoData(page.seoJsonb) : null);
    }, [pages, selectedSeoPageId]);

    useEffect(() => {
        setCustomCode(settings?.customCode || {});
    }, [settings?.customCode]);

    useEffect(() => {
        if (initialTab === 'metadata' || initialTab === 'code' || initialTab === 'themes') {
            setWebsiteSettingsTab(initialTab);
        }
    }, [initialTab]);

    const handleSave = () => {
        onSave({ tokens, seo: seoSettings, customCode });
    };

    const updateTokens = (nextTokens: WebsiteSettings['tokens']) => {
        setTokens(nextTokens);
        setSelectedTemplateId(findMatchingTemplateId(nextTokens));
    };

    const handleApplyTemplate = (template: ThemeTemplate) => {
        updateTokens({
            ...template.tokens,
            font: template.recommendedFont,
        });
    };

    const handleColorTokenChange = (key: ColorTokenKey, value: string) => {
        updateTokens({ ...tokens, [key]: value });
    };

    const updateWebsiteSeoField = <K extends keyof SEOData>(key: K, value: SEOData[K]) => {
        setSeoSettings((prev) => ({
            ...prev,
            defaults: {
                ...(prev.defaults || {}),
                [key]: value,
            },
        }));
    };

    const updateBusinessSeoField = <K extends keyof WebsiteSEOBusiness>(key: K, value: WebsiteSEOBusiness[K]) => {
        setSeoSettings((prev) => ({
            ...prev,
            business: {
                ...(prev.business || {}),
                [key]: value,
            },
        }));
    };

    const updatePageSeoField = <K extends keyof SEOData>(key: K, value: SEOData[K]) => {
        setPageSeoDraft((prev) => ({
            ...(prev || {}),
            [key]: value,
        }));
    };

    const selectedSeoPage = pages.find((page) => page.id === selectedSeoPageId) || null;
    const activeTemplate = selectedTemplateId ? THEME_TEMPLATES.find((template) => template.id === selectedTemplateId) : null;
    const fontSuggestions = Array.from(new Set([...(activeTemplate?.fontSuggestions || []), ...DEFAULT_FONT_SUGGESTIONS, tokens.font]));
    const websiteSeoDefaults = seoSettings.defaults || {};
    const businessSeo = seoSettings.business || {};
    const pageSeo = pageSeoDraft || {};
    const websiteSameAsCsv = Array.isArray(businessSeo.sameAs) ? businessSeo.sameAs.join(', ') : '';

    const getSeoFieldLength = (value: string | null | undefined): number => (value || '').trim().length;

    const savePageSeoDraft = async () => {
        if (!selectedSeoPageId) return;
        setPageSeoSaving(true);
        setPageSeoMessage(null);
        const result = await onSavePageSeo(selectedSeoPageId, pageSeoDraft && Object.keys(pageSeoDraft).length > 0 ? pageSeoDraft : null);
        if (result.success) {
            setPageSeoMessage('Page metadata saved.');
        } else {
            setPageSeoMessage(result.message || 'Failed to save page metadata.');
        }
        setPageSeoSaving(false);
    };

    const resetPageSeoDraft = async () => {
        if (!selectedSeoPageId) return;
        setPageSeoSaving(true);
        setPageSeoMessage(null);
        const result = await onSavePageSeo(selectedSeoPageId, null);
        if (result.success) {
            setPageSeoDraft(null);
            setPageSeoMessage('Page metadata reset to website defaults.');
        } else {
            setPageSeoMessage(result.message || 'Failed to reset page metadata.');
        }
        setPageSeoSaving(false);
    };

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                        type="button"
                        onClick={() => setWebsiteSettingsTab('themes')}
                        style={{
                            ...actionBtnStyle,
                            backgroundColor: websiteSettingsTab === 'themes' ? 'var(--be-form-active-bg, #eff6ff)' : actionBtnStyle.backgroundColor,
                            borderColor: websiteSettingsTab === 'themes' ? '#3b82f6' : 'var(--be-form-border, #cbd5e1)',
                            color: websiteSettingsTab === 'themes' ? 'var(--be-form-active-text, #1d4ed8)' : 'var(--be-form-label, #475569)',
                        }}
                    >
                        Themes
                    </button>
                    <button
                        type="button"
                        onClick={() => setWebsiteSettingsTab('metadata')}
                        style={{
                            ...actionBtnStyle,
                            backgroundColor: websiteSettingsTab === 'metadata' ? 'var(--be-form-active-bg, #eff6ff)' : actionBtnStyle.backgroundColor,
                            borderColor: websiteSettingsTab === 'metadata' ? '#3b82f6' : 'var(--be-form-border, #cbd5e1)',
                            color: websiteSettingsTab === 'metadata' ? 'var(--be-form-active-text, #1d4ed8)' : 'var(--be-form-label, #475569)',
                        }}
                    >
                        Metadata
                    </button>
                    <button
                        type="button"
                        onClick={() => setWebsiteSettingsTab('code')}
                        style={{
                            ...actionBtnStyle,
                            backgroundColor: websiteSettingsTab === 'code' ? 'var(--be-form-active-bg, #eff6ff)' : actionBtnStyle.backgroundColor,
                            borderColor: websiteSettingsTab === 'code' ? '#3b82f6' : 'var(--be-form-border, #cbd5e1)',
                            color: websiteSettingsTab === 'code' ? 'var(--be-form-active-text, #1d4ed8)' : 'var(--be-form-label, #475569)',
                        }}
                    >
                        Custom Code
                    </button>
                </div>

                {websiteSettingsTab === 'themes' && (
                    <>
                        <div>
                            <div style={sectionTitleStyle}>Theme Templates</div>
                            <p style={{ fontSize: '12px', color: 'var(--be-form-muted, #64748b)', margin: '0 0 10px 0' }}>
                                Select a predefined template to update the full website colors instantly.
                            </p>
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {THEME_TEMPLATES.map((template) => {
                                    const isActive = selectedTemplateId === template.id;
                                    return (
                                        <button
                                            key={template.id}
                                            onClick={() => handleApplyTemplate(template)}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                border: `1px solid ${isActive ? '#3b82f6' : 'var(--be-form-border, #cbd5e1)'}`,
                                                backgroundColor: isActive ? 'var(--be-form-active-bg, #eff6ff)' : 'var(--be-form-bg, #ffffff)',
                                                borderRadius: '8px',
                                                padding: '10px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--be-form-heading, #0f172a)' }}>{template.name}</div>
                                                {isActive && (
                                                    <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>Applied</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--be-form-muted, #64748b)', marginTop: '2px' }}>{template.description}</div>
                                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                                {TEMPLATE_SWATCH_ORDER.map((key) => (
                                                    <span
                                                        key={key}
                                                        title={`${key}: ${template.tokens[key]}`}
                                                        style={{
                                                            width: '14px',
                                                            height: '14px',
                                                            borderRadius: '999px',
                                                            border: '1px solid var(--be-form-swatch-border, rgba(15, 23, 42, 0.15))',
                                                            backgroundColor: template.tokens[key],
                                                            display: 'inline-block',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--be-form-label, #475569)', marginTop: '8px' }}>
                                                Suggested font: <span style={{ fontWeight: 600 }}>{template.recommendedFont}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {!selectedTemplateId && (
                                <p style={{ fontSize: '12px', color: 'var(--be-form-muted, #64748b)', margin: '10px 0 0 0' }}>
                                    Current palette is custom.
                                </p>
                            )}
                        </div>

                        <div>
                            <div style={sectionTitleStyle}>Font Suggestions</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {fontSuggestions.map((fontName) => {
                                    const isActive = tokens.font === fontName;
                                    return (
                                        <button
                                            key={fontName}
                                            onClick={() => updateTokens({ ...tokens, font: fontName })}
                                            style={{
                                                padding: '6px 10px',
                                                borderRadius: '999px',
                                                border: `1px solid ${isActive ? '#3b82f6' : 'var(--be-form-border, #cbd5e1)'}`,
                                                backgroundColor: isActive ? 'var(--be-form-active-bg, #eff6ff)' : 'var(--be-form-bg, #ffffff)',
                                                color: isActive ? 'var(--be-form-active-text, #1d4ed8)' : 'var(--be-form-label, #475569)',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontFamily: fontName,
                                            }}
                                        >
                                            {fontName}
                                        </button>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                <label style={labelStyle}>Custom Font Family</label>
                                <input
                                    type="text"
                                    value={tokens.font}
                                    onChange={(e) => updateTokens({ ...tokens, font: e.target.value })}
                                    placeholder="e.g. Poppins"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div>
                            <div style={sectionTitleStyle}>Fine-tune Colors</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {COLOR_INPUT_ORDER.map((key) => (
                                    <div key={key}>
                                        <label style={{ ...labelStyle, textTransform: 'capitalize' }}>{key}</label>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input
                                                type="color"
                                                value={toColorInputValue(tokens[key])}
                                                onChange={(e) => handleColorTokenChange(key, e.target.value)}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    border: '1px solid var(--be-form-border, #cbd5e1)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    padding: '2px',
                                                    backgroundColor: 'var(--be-form-bg, #ffffff)',
                                                }}
                                            />
                                            <input
                                                type="text"
                                                value={tokens[key]}
                                                onChange={(e) => handleColorTokenChange(key, e.target.value)}
                                                style={{ ...inputStyle, width: 'auto', flex: 1 }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '12px' }}>
                                <button onClick={() => updateTokens(DEFAULT_TOKENS)} style={actionBtnStyle}>
                                    Reset to Default
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {websiteSettingsTab === 'metadata' && (
                    <div>
                        <div style={sectionTitleStyle}>Metadata</div>
                        <p style={{ fontSize: '12px', color: 'var(--be-form-muted, #64748b)', margin: '0 0 10px 0' }}>
                            Configure defaults for this website, then override metadata for specific pages when needed.
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--be-form-muted, #64748b)', margin: '0 0 10px 0' }}>
                            This section includes only the new SEO metadata fields.
                        </p>

                        <div style={{ marginBottom: '10px' }}>
                            <label style={labelStyle}>Site Name</label>
                            <input
                                type="text"
                                value={seoSettings.siteName ?? ''}
                                onChange={(e) => setSeoSettings((prev) => ({ ...prev, siteName: normalizeNullableString(e.target.value) }))}
                                placeholder="Business name used in metadata"
                                style={inputStyle}
                            />
                        </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        <button
                            type="button"
                            onClick={() => setSeoMode('website')}
                            style={{
                                ...actionBtnStyle,
                                backgroundColor: seoMode === 'website' ? 'var(--be-form-active-bg, #eff6ff)' : actionBtnStyle.backgroundColor,
                                borderColor: seoMode === 'website' ? '#3b82f6' : 'var(--be-form-border, #cbd5e1)',
                                color: seoMode === 'website' ? 'var(--be-form-active-text, #1d4ed8)' : 'var(--be-form-label, #475569)',
                            }}
                        >
                            Website Defaults
                        </button>
                        <button
                            type="button"
                            onClick={() => setSeoMode('page')}
                            style={{
                                ...actionBtnStyle,
                                backgroundColor: seoMode === 'page' ? 'var(--be-form-active-bg, #eff6ff)' : actionBtnStyle.backgroundColor,
                                borderColor: seoMode === 'page' ? '#3b82f6' : 'var(--be-form-border, #cbd5e1)',
                                color: seoMode === 'page' ? 'var(--be-form-active-text, #1d4ed8)' : 'var(--be-form-label, #475569)',
                            }}
                        >
                            Page Overrides
                        </button>
                    </div>

                    {seoMode === 'website' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Meta Title</label>
                                <input
                                    type="text"
                                    value={websiteSeoDefaults.metaTitle ?? ''}
                                    onChange={(e) => updateWebsiteSeoField('metaTitle', normalizeNullableString(e.target.value))}
                                    style={inputStyle}
                                />
                                <div style={{ fontSize: '11px', color: 'var(--be-form-muted, #64748b)', marginTop: '4px' }}>
                                    Recommended 50-60 chars ({getSeoFieldLength(websiteSeoDefaults.metaTitle)}/60)
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Meta Description</label>
                                <textarea
                                    value={websiteSeoDefaults.metaDescription ?? ''}
                                    onChange={(e) => updateWebsiteSeoField('metaDescription', normalizeNullableString(e.target.value))}
                                    rows={3}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                                <div style={{ fontSize: '11px', color: 'var(--be-form-muted, #64748b)', marginTop: '4px' }}>
                                    Recommended 140-160 chars ({getSeoFieldLength(websiteSeoDefaults.metaDescription)}/160)
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Meta Keywords</label>
                                <input
                                    type="text"
                                    value={websiteSeoDefaults.metaKeywords ?? ''}
                                    onChange={(e) => updateWebsiteSeoField('metaKeywords', normalizeNullableString(e.target.value))}
                                    placeholder="spa, massage, skincare"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Canonical Path (optional)</label>
                                <input
                                    type="text"
                                    value={websiteSeoDefaults.canonicalPath ?? ''}
                                    onChange={(e) => updateWebsiteSeoField('canonicalPath', normalizeNullableString(e.target.value))}
                                    placeholder="/"
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <label style={{ ...labelStyle, marginBottom: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={websiteSeoDefaults.robotsIndex !== false}
                                        onChange={(e) => updateWebsiteSeoField('robotsIndex', e.target.checked)}
                                        style={{ marginRight: '6px' }}
                                    />
                                    Index
                                </label>
                                <label style={{ ...labelStyle, marginBottom: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={websiteSeoDefaults.robotsFollow !== false}
                                        onChange={(e) => updateWebsiteSeoField('robotsFollow', e.target.checked)}
                                        style={{ marginRight: '6px' }}
                                    />
                                    Follow
                                </label>
                            </div>
                            <div>
                                <label style={labelStyle}>Open Graph Title</label>
                                <input
                                    type="text"
                                    value={websiteSeoDefaults.ogTitle ?? ''}
                                    onChange={(e) => updateWebsiteSeoField('ogTitle', normalizeNullableString(e.target.value))}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Open Graph Description</label>
                                <textarea
                                    value={websiteSeoDefaults.ogDescription ?? ''}
                                    onChange={(e) => updateWebsiteSeoField('ogDescription', normalizeNullableString(e.target.value))}
                                    rows={2}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Open Graph Image URL</label>
                                <input
                                    type="url"
                                    value={websiteSeoDefaults.ogImageUrl ?? ''}
                                    onChange={(e) => updateWebsiteSeoField('ogImageUrl', normalizeNullableString(e.target.value))}
                                    placeholder="https://example.com/og-image.jpg"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Open Graph Image Alt</label>
                                <input
                                    type="text"
                                    value={websiteSeoDefaults.ogImageAlt ?? ''}
                                    onChange={(e) => updateWebsiteSeoField('ogImageAlt', normalizeNullableString(e.target.value))}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Twitter Card</label>
                                <select
                                    value={websiteSeoDefaults.twitterCard ?? 'summary_large_image'}
                                    onChange={(e) => updateWebsiteSeoField('twitterCard', (e.target.value as TwitterCardType))}
                                    style={inputStyle}
                                >
                                    <option value="summary_large_image">summary_large_image</option>
                                    <option value="summary">summary</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Twitter Title</label>
                                <input
                                    type="text"
                                    value={websiteSeoDefaults.twitterTitle ?? ''}
                                    onChange={(e) => updateWebsiteSeoField('twitterTitle', normalizeNullableString(e.target.value))}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Twitter Description</label>
                                <textarea
                                    value={websiteSeoDefaults.twitterDescription ?? ''}
                                    onChange={(e) => updateWebsiteSeoField('twitterDescription', normalizeNullableString(e.target.value))}
                                    rows={2}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Twitter Image URL</label>
                                <input
                                    type="url"
                                    value={websiteSeoDefaults.twitterImageUrl ?? ''}
                                    onChange={(e) => updateWebsiteSeoField('twitterImageUrl', normalizeNullableString(e.target.value))}
                                    placeholder="https://example.com/twitter-image.jpg"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Twitter Image Alt</label>
                                <input
                                    type="text"
                                    value={websiteSeoDefaults.twitterImageAlt ?? ''}
                                    onChange={(e) => updateWebsiteSeoField('twitterImageAlt', normalizeNullableString(e.target.value))}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={{ ...sectionTitleStyle, marginTop: '4px' }}>Structured Data (Business)</div>
                            <div>
                                <label style={labelStyle}>Business Type</label>
                                <input
                                    type="text"
                                    value={businessSeo.businessType ?? ''}
                                    onChange={(e) => updateBusinessSeoField('businessType', normalizeNullableString(e.target.value))}
                                    placeholder="LocalBusiness / Organization / HealthAndBeautyBusiness"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Business Name</label>
                                <input
                                    type="text"
                                    value={businessSeo.name ?? ''}
                                    onChange={(e) => updateBusinessSeoField('name', normalizeNullableString(e.target.value))}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Business Description</label>
                                <textarea
                                    value={businessSeo.description ?? ''}
                                    onChange={(e) => updateBusinessSeoField('description', normalizeNullableString(e.target.value))}
                                    rows={2}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Business Image URL</label>
                                <input
                                    type="url"
                                    value={businessSeo.imageUrl ?? ''}
                                    onChange={(e) => updateBusinessSeoField('imageUrl', normalizeNullableString(e.target.value))}
                                    placeholder="https://example.com/business.jpg"
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={labelStyle}>Telephone</label>
                                    <input
                                        type="text"
                                        value={businessSeo.telephone ?? ''}
                                        onChange={(e) => updateBusinessSeoField('telephone', normalizeNullableString(e.target.value))}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Email</label>
                                    <input
                                        type="email"
                                        value={businessSeo.email ?? ''}
                                        onChange={(e) => updateBusinessSeoField('email', normalizeNullableString(e.target.value))}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Price Range</label>
                                <input
                                    type="text"
                                    value={businessSeo.priceRange ?? ''}
                                    onChange={(e) => updateBusinessSeoField('priceRange', normalizeNullableString(e.target.value))}
                                    placeholder="$$"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Street Address</label>
                                <input
                                    type="text"
                                    value={businessSeo.streetAddress ?? ''}
                                    onChange={(e) => updateBusinessSeoField('streetAddress', normalizeNullableString(e.target.value))}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={labelStyle}>City</label>
                                    <input
                                        type="text"
                                        value={businessSeo.addressLocality ?? ''}
                                        onChange={(e) => updateBusinessSeoField('addressLocality', normalizeNullableString(e.target.value))}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Region/State</label>
                                    <input
                                        type="text"
                                        value={businessSeo.addressRegion ?? ''}
                                        onChange={(e) => updateBusinessSeoField('addressRegion', normalizeNullableString(e.target.value))}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={labelStyle}>Postal Code</label>
                                    <input
                                        type="text"
                                        value={businessSeo.postalCode ?? ''}
                                        onChange={(e) => updateBusinessSeoField('postalCode', normalizeNullableString(e.target.value))}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Country</label>
                                    <input
                                        type="text"
                                        value={businessSeo.addressCountry ?? ''}
                                        onChange={(e) => updateBusinessSeoField('addressCountry', normalizeNullableString(e.target.value))}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Social Links (`sameAs`)</label>
                                <textarea
                                    value={websiteSameAsCsv}
                                    onChange={(e) =>
                                        updateBusinessSeoField(
                                            'sameAs',
                                            e.target.value
                                                .split(',')
                                                .map((entry) => entry.trim())
                                                .filter(Boolean),
                                        )
                                    }
                                    rows={2}
                                    placeholder="https://facebook.com/yourbrand, https://instagram.com/yourbrand"
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Select Page</label>
                                <select
                                    value={selectedSeoPageId}
                                    onChange={(e) => {
                                        setSelectedSeoPageId(e.target.value);
                                        setPageSeoMessage(null);
                                    }}
                                    style={inputStyle}
                                >
                                    {pages.map((page) => (
                                        <option key={page.id} value={page.id}>
                                            {page.slug === '/' ? 'Home (/)': `${page.title} (/${page.slug})`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedSeoPage ? (
                                <>
                                    <div>
                                        <label style={labelStyle}>Meta Title</label>
                                        <input
                                            type="text"
                                            value={pageSeo.metaTitle ?? ''}
                                            onChange={(e) => updatePageSeoField('metaTitle', normalizeNullableString(e.target.value))}
                                            style={inputStyle}
                                        />
                                        <div style={{ fontSize: '11px', color: 'var(--be-form-muted, #64748b)', marginTop: '4px' }}>
                                            Recommended 50-60 chars ({getSeoFieldLength(pageSeo.metaTitle)}/60)
                                        </div>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Meta Description</label>
                                        <textarea
                                            value={pageSeo.metaDescription ?? ''}
                                            onChange={(e) => updatePageSeoField('metaDescription', normalizeNullableString(e.target.value))}
                                            rows={3}
                                            style={{ ...inputStyle, resize: 'vertical' }}
                                        />
                                        <div style={{ fontSize: '11px', color: 'var(--be-form-muted, #64748b)', marginTop: '4px' }}>
                                            Recommended 140-160 chars ({getSeoFieldLength(pageSeo.metaDescription)}/160)
                                        </div>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Meta Keywords</label>
                                        <input
                                            type="text"
                                            value={pageSeo.metaKeywords ?? ''}
                                            onChange={(e) => updatePageSeoField('metaKeywords', normalizeNullableString(e.target.value))}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Canonical Path</label>
                                        <input
                                            type="text"
                                            value={pageSeo.canonicalPath ?? ''}
                                            onChange={(e) => updatePageSeoField('canonicalPath', normalizeNullableString(e.target.value))}
                                            placeholder={selectedSeoPage.slug === '/' ? '/' : `/${selectedSeoPage.slug}`}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <label style={{ ...labelStyle, marginBottom: 0 }}>
                                            <input
                                                type="checkbox"
                                                checked={pageSeo.robotsIndex !== false}
                                                onChange={(e) => updatePageSeoField('robotsIndex', e.target.checked)}
                                                style={{ marginRight: '6px' }}
                                            />
                                            Index
                                        </label>
                                        <label style={{ ...labelStyle, marginBottom: 0 }}>
                                            <input
                                                type="checkbox"
                                                checked={pageSeo.robotsFollow !== false}
                                                onChange={(e) => updatePageSeoField('robotsFollow', e.target.checked)}
                                                style={{ marginRight: '6px' }}
                                            />
                                            Follow
                                        </label>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Open Graph Title</label>
                                        <input
                                            type="text"
                                            value={pageSeo.ogTitle ?? ''}
                                            onChange={(e) => updatePageSeoField('ogTitle', normalizeNullableString(e.target.value))}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Open Graph Description</label>
                                        <textarea
                                            value={pageSeo.ogDescription ?? ''}
                                            onChange={(e) => updatePageSeoField('ogDescription', normalizeNullableString(e.target.value))}
                                            rows={2}
                                            style={{ ...inputStyle, resize: 'vertical' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Open Graph Image URL</label>
                                        <input
                                            type="url"
                                            value={pageSeo.ogImageUrl ?? ''}
                                            onChange={(e) => updatePageSeoField('ogImageUrl', normalizeNullableString(e.target.value))}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Open Graph Image Alt</label>
                                        <input
                                            type="text"
                                            value={pageSeo.ogImageAlt ?? ''}
                                            onChange={(e) => updatePageSeoField('ogImageAlt', normalizeNullableString(e.target.value))}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Twitter Card</label>
                                        <select
                                            value={pageSeo.twitterCard ?? 'summary_large_image'}
                                            onChange={(e) => updatePageSeoField('twitterCard', e.target.value as TwitterCardType)}
                                            style={inputStyle}
                                        >
                                            <option value="summary_large_image">summary_large_image</option>
                                            <option value="summary">summary</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Twitter Title</label>
                                        <input
                                            type="text"
                                            value={pageSeo.twitterTitle ?? ''}
                                            onChange={(e) => updatePageSeoField('twitterTitle', normalizeNullableString(e.target.value))}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Twitter Description</label>
                                        <textarea
                                            value={pageSeo.twitterDescription ?? ''}
                                            onChange={(e) => updatePageSeoField('twitterDescription', normalizeNullableString(e.target.value))}
                                            rows={2}
                                            style={{ ...inputStyle, resize: 'vertical' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Twitter Image URL</label>
                                        <input
                                            type="url"
                                            value={pageSeo.twitterImageUrl ?? ''}
                                            onChange={(e) => updatePageSeoField('twitterImageUrl', normalizeNullableString(e.target.value))}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Twitter Image Alt</label>
                                        <input
                                            type="text"
                                            value={pageSeo.twitterImageAlt ?? ''}
                                            onChange={(e) => updatePageSeoField('twitterImageAlt', normalizeNullableString(e.target.value))}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={() => void savePageSeoDraft()}
                                            disabled={pageSeoSaving}
                                            style={{
                                                ...actionBtnStyle,
                                                backgroundColor: pageSeoSaving ? '#cbd5e1' : '#e2e8f0',
                                            }}
                                        >
                                            {pageSeoSaving ? 'Saving...' : 'Save Page Metadata'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void resetPageSeoDraft()}
                                            disabled={pageSeoSaving}
                                            style={{
                                                ...actionBtnStyle,
                                                borderColor: '#fca5a5',
                                                color: '#b91c1c',
                                            }}
                                        >
                                            Reset to Defaults
                                        </button>
                                    </div>
                                    {pageSeoMessage && (
                                        <div style={{ fontSize: '12px', color: pageSeoMessage.includes('Failed') ? '#b91c1c' : '#0f766e' }}>
                                            {pageSeoMessage}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p style={{ fontSize: '12px', color: 'var(--be-form-muted, #64748b)' }}>
                                    No pages available to configure overrides.
                                </p>
                            )}
                        </div>
                    )}
                    </div>
                )}

                {websiteSettingsTab === 'code' && (
                    <div>
                        <div style={sectionTitleStyle}>Custom HTML Tags</div>
                        <p style={{ fontSize: '12px', color: 'var(--be-form-muted, #64748b)', margin: '0 0 14px 0' }}>
                            Add verification tags, analytics scripts, or any custom HTML into your published website. Save settings, then publish the site again to see the changes in page source.
                        </p>

                        <div style={{ marginBottom: '16px' }}>

                            <label style={labelStyle}>Head HTML</label>

                            <p style={{ fontSize: '11px', color: 'var(--be-form-muted, #64748b)', margin: '2px 0 6px 0' }}>
                                Rendered inside the published document <code style={{ background: '#f1f5f9', padding: '0 3px', borderRadius: '3px' }}>&lt;head&gt;</code> - ideal for Google Site Verification, GA4, and other meta tags or scripts.
                            </p>
                            <textarea
                                value={customCode.head || ''}
                                onChange={(e) => setCustomCode({ ...customCode, head: e.target.value })}
                                rows={4}
                                placeholder={'<meta name="google-site-verification" content="..." />\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>'}
                                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>

                            <label style={labelStyle}>Body HTML</label>

                            <p style={{ fontSize: '11px', color: 'var(--be-form-muted, #64748b)', margin: '2px 0 6px 0' }}>
                                Rendered immediately after the opening <code style={{ background: '#f1f5f9', padding: '0 3px', borderRadius: '3px' }}>&lt;body&gt;</code> tag - ideal for Google Tag Manager noscript.
                            </p>
                            <textarea
                                value={customCode.bodyTop || ''}
                                onChange={(e) => setCustomCode({ ...customCode, bodyTop: e.target.value })}
                                rows={4}
                                placeholder={'<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>'}
                                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Footer HTML</label>
                            <p style={{ fontSize: '11px', color: 'var(--be-form-muted, #64748b)', margin: '2px 0 6px 0' }}>
                                Injected right before the closing <code style={{ background: '#f1f5f9', padding: '0 3px', borderRadius: '3px' }}>&lt;/body&gt;</code> even if the page has no visible theme footer section - ideal for chat widgets or deferred scripts.

                            </p>
                            <textarea
                                value={customCode.bodyBottom || ''}
                                onChange={(e) => setCustomCode({ ...customCode, bodyBottom: e.target.value })}
                                rows={4}
                                placeholder={'<script src="https://cdn.example.com/widget.js" defer></script>'}
                                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                    width: '100%', marginTop: '16px', padding: '10px 16px',
                    backgroundColor: saving ? '#9ca3af' : '#3b82f6',
                    color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                    flexShrink: 0,
                }}
            >
                {saving ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
    );
}
