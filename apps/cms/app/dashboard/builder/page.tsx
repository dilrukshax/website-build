'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
    isPublished: boolean;
    sortOrder: number;
    sectionCount: number;
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
    showAllServices: false,
    featuredCount: 3,
    showSelectButton: true,
    selectButtonText: 'Select Service',
} as const;
const PAGE_TITLE_SUGGESTIONS = ['About', 'Team', 'Services', 'Contact'] as const;

const SECTION_AUTOSAVE_DELAY_MS = 700;

function normalizeServicesSchema(
    schema: React.ComponentProps<typeof SchemaForm>['schema']
): React.ComponentProps<typeof SchemaForm>['schema'] {
    const rawProperties = schema.properties || {};
    const remaining = { ...rawProperties };
    delete (remaining as Record<string, unknown>).services;

    return {
        ...schema,
        properties: {
            title: remaining.title ?? { type: 'string', title: 'Section Title' },
            subtitle: remaining.subtitle ?? { type: 'string', title: 'Subtitle' },
            ctaText: remaining.ctaText ?? { type: 'string', title: 'Button Text (Optional)' },
            ctaLink: remaining.ctaLink ?? { type: 'string', title: 'Button Link', format: 'page-link' },
            showAllServices: { type: 'boolean', title: 'Show All Services' },
            featuredCount: { type: 'number', title: 'Featured Services Count' },
            showSelectButton: { type: 'boolean', title: 'Show Select Service Button' },
            selectButtonText: { type: 'string', title: 'Select Button Text' },
        },
        required: (schema.required || []).filter((key) => key !== 'services'),
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

export default function BuilderPage() {
    const { currentTenant, currentInstance } = useAuth();

    const [pages, setPages] = useState<PageData[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [sections, setSections] = useState<SectionData[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [settings, setSettings] = useState<WebsiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [themePickerOpen, setThemePickerOpen] = useState(false);
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
    const [sectionSaveState, setSectionSaveState] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
    const [sectionSaveError, setSectionSaveError] = useState('');
    const sectionAutosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sectionSaveResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSectionSaveRef = useRef<{ sectionId: string; contentJsonb: Record<string, unknown> } | null>(null);
    const latestSectionSaveRequestIdRef = useRef(0);
    const isMountedRef = useRef(true);

    const tokens = settings?.tokens || DEFAULT_TOKENS;
    useHostedFont(tokens.font);

    const selectedPage = pages.find((page) => page.id === selectedPageId) || null;
    const selectedSection = sections.find((s) => s.id === selectedSectionId);
    const isServicesSection = selectedSection?.theme.componentKey.startsWith('services/') === true;
    const selectedSectionIndex = selectedSection
        ? sections.findIndex((section) => section.id === selectedSection.id)
        : -1;
    const selectedSectionSchema = selectedSection
        ? isServicesSection
            ? normalizeServicesSchema(
                selectedSection.theme.schemaJsonb as unknown as React.ComponentProps<typeof SchemaForm>['schema']
            )
            : selectedSection.theme.componentKey === 'header/v1'
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
            : selectedSection.theme.componentKey === 'header/v1'
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
    const pageLimitReached = billingUsage?.limits.maxPagesPerInstance !== null
        && (billingUsage?.instanceUsage?.pages || 0) >= (billingUsage?.limits.maxPagesPerInstance || 0);
    const homePage = pages.find((page) => page.slug === '/');
    const homePageExists = Boolean(homePage);
    const homePageReadyForAdditionalPages = homePageExists && (homePage?.sectionCount || 0) > 0;
    const canCreateHomePage = !homePageExists && !pageLimitReached;
    const canCreateAdditionalPages = homePageReadyForAdditionalPages && !pageLimitReached;
    const publishBlockedByPlan = Boolean(publishReadiness && !publishReadiness.canPublish);
    const existingGlobalLayoutKeys = ['header/v1', 'footer/v1'].filter((componentKey) =>
        sections.some((section) => section.theme.componentKey === componentKey)
    );

    function openSectionInspector(sectionId: string) {
        setSelectedSectionId(sectionId);
        setShowSettings(false);
        setIsRightPanelOpen(true);
    }

    function openWebsiteSettingsInspector() {
        setShowSettings(true);
        setSelectedSectionId(null);
        setIsRightPanelOpen(true);
    }

    // Load pages
    const loadPages = useCallback(async () => {
        const res = await api.get<PageData[]>('/cms/pages');
        if (res.success && res.data) {
            setPages(res.data);
            if (res.data.length > 0 && !selectedPageId) {
                setSelectedPageId(res.data[0]!.id);
            }
        }
    }, [selectedPageId]);

    // Load sections for selected page
    const loadSections = useCallback(async () => {
        if (!selectedPageId) return;
        const res = await api.get<SectionData[]>(`/cms/pages/${selectedPageId}/sections`);
        if (res.success && res.data) {
            setSections(res.data);
        }
    }, [selectedPageId]);

    // Load settings
    const loadSettings = useCallback(async () => {
        const res = await api.get<{ settings: WebsiteSettings }>('/cms/builder/settings');
        if (res.success && res.data) {
            setSettings(res.data.settings);
        }
    }, []);

    const loadInstanceUsage = useCallback(async () => {
        if (!currentInstance?.id) {
            setBillingUsage(null);
            return;
        }

        const res = await api.get<BillingUsageSnapshot>(`/cms/billing/usage?instanceId=${encodeURIComponent(currentInstance.id)}`);
        if (res.success && res.data) {
            setBillingUsage(res.data);
        }
    }, [currentInstance?.id]);

    const loadPublishReadiness = useCallback(async () => {
        if (!currentInstance?.id) {
            setPublishReadiness(null);
            return;
        }

        const res = await api.get<PublishReadinessSnapshot>('/cms/builder/publish-readiness');
        if (res.success && res.data) {
            setPublishReadiness(res.data);
        }
    }, [currentInstance?.id]);

    const persistSectionContent = useCallback(async (sectionId: string, contentJsonb: Record<string, unknown>) => {
        const requestId = ++latestSectionSaveRequestIdRef.current;
        setSectionSaveState('saving');
        setSectionSaveError('');

        const res = await api.put<SectionData>(`/cms/sections/${sectionId}`, { contentJsonb });

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
                ? { ...section, contentJsonb }
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
        await persistSectionContent(pending.sectionId, pending.contentJsonb);
    }, [persistSectionContent]);

    const scheduleSectionAutosave = useCallback((sectionId: string, contentJsonb: Record<string, unknown>) => {
        pendingSectionSaveRef.current = { sectionId, contentJsonb };

        if (sectionAutosaveTimerRef.current) {
            clearTimeout(sectionAutosaveTimerRef.current);
        }

        sectionAutosaveTimerRef.current = setTimeout(() => {
            const pending = pendingSectionSaveRef.current;
            if (!pending) {
                return;
            }

            pendingSectionSaveRef.current = null;
            void persistSectionContent(pending.sectionId, pending.contentJsonb);
        }, SECTION_AUTOSAVE_DELAY_MS);
    }, [persistSectionContent]);

    const handleSectionDraftChange = useCallback((sectionId: string, contentJsonb: Record<string, unknown>) => {
        setSectionDrafts((prevDrafts) => ({ ...prevDrafts, [sectionId]: contentJsonb }));
        setSections((prevSections) => prevSections.map((section) =>
            section.id === sectionId
                ? { ...section, contentJsonb }
                : section,
        ));
        setSectionSaveState('pending');
        setSectionSaveError('');
        scheduleSectionAutosave(sectionId, contentJsonb);
    }, [scheduleSectionAutosave]);

    useEffect(() => {
        if (currentInstance) {
            setLoading(true);
            Promise.all([loadPages(), loadSettings(), loadInstanceUsage(), loadPublishReadiness()]).then(() => setLoading(false));
        }
    }, [currentInstance, loadPages, loadSettings, loadInstanceUsage, loadPublishReadiness]);

    useEffect(() => {
        if (selectedPageId) {
            loadSections();
        }
    }, [selectedPageId, loadSections]);

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
        if (!showSettings && !selectedSectionId) {
            setIsRightPanelOpen(false);
        }
    }, [showSettings, selectedSectionId]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (sectionAutosaveTimerRef.current) {
                clearTimeout(sectionAutosaveTimerRef.current);
            }
            if (sectionSaveResetTimerRef.current) {
                clearTimeout(sectionSaveResetTimerRef.current);
            }
            const pending = pendingSectionSaveRef.current;
            if (pending) {
                void api.put(`/cms/sections/${pending.sectionId}`, { contentJsonb: pending.contentJsonb });
            }
        };
    }, []);

    // Create page
    const handleCreatePage = async () => {
        const creatingHomePage = !homePageExists;
        if (!creatingHomePage && !canCreateAdditionalPages) {
            alert('Set up your Home page with a template or at least one section before adding more pages.');
            return;
        }

        const title = creatingHomePage ? 'Home' : newPageTitle.trim();
        if (!title) return;

        const slug = creatingHomePage
            ? '/'
            : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const res = await api.post<PageData>('/cms/pages', { title, slug: slug || 'page' });
        if (!res.success || !res.data) {
            alert(res.error?.message || 'Failed to create page');
            return;
        }

        setNewPageTitle('');
        setShowNewPage(false);
        setSelectedSectionId(null);
        setShowSettings(false);
        await loadPages();
        await loadInstanceUsage();
        setSelectedPageId(res.data.id);
        setTemplatePickerOpen(true);
    };

    // Delete page
    const handleDeletePage = async (pageId: string) => {
        const page = pages.find((entry) => entry.id === pageId);
        if (!page) return;
        if (page.slug === '/') {
            alert('Home page cannot be deleted.');
            return;
        }

        if (!confirm(`Delete "${page.title}" page?`)) return;
        const res = await api.del(`/cms/pages/${pageId}`);
        if (!res.success) {
            alert(res.error?.message || 'Failed to delete page');
            return;
        }

        if (selectedPageId === pageId) setSelectedPageId(null);
        await loadPages();
        await loadInstanceUsage();
        await loadPublishReadiness();
    };

    // Add section
    const handleAddSection = async (theme: ThemeCatalogTheme) => {
        if (!selectedPageId) return;
        await flushPendingSectionSave();
        const res = await api.post<SectionData>(`/cms/pages/${selectedPageId}/sections`, { themeId: theme.id });
        if (res.success) {
            await loadSections();
            await loadPages();
            await loadPublishReadiness();
            const maxAccessibleThemes = publishReadiness?.maxAccessibleThemes ?? null;
            if (maxAccessibleThemes !== null && theme.accessRank > maxAccessibleThemes) {
                alert('Premium section added for preview. Upgrade your plan to publish this website.');
            }
            return;
        }
        alert(res.error?.message || 'Failed to add this section.');
    };

    // Apply template
    const handleApplyTemplate = async (templateId: string) => {
        if (!selectedPageId) return;
        await flushPendingSectionSave();
        setTemplatePickerOpen(false);
        setLoading(true);
        const res = await api.post(`/cms/pages/${selectedPageId}/apply-template`, { templateId });
        if (res.success) {
            await loadSections();
            await loadPages();
            await loadPublishReadiness();
        } else {
            alert(res.error?.message || 'Failed to apply template');
        }
        setLoading(false);
    };

    // Delete section
    const handleDeleteSection = async (sectionId: string) => {
        if (!confirm('Remove this section?')) return;
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
    };

    // Move section
    const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
        await flushPendingSectionSave();
        const idx = sections.findIndex((s) => s.id === sectionId);
        if (idx < 0) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sections.length) return;

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

        await flushPendingSectionSave();
        setPublishing(true);
        const res = await api.post<{ version: number }>('/cms/builder/publish');
        if (res.success && res.data) {
            const liveSiteUrl = await resolveLiveSiteUrl();
            if (liveSiteUrl) {
                const cacheBuster = res.data.version || Date.now();
                const separator = liveSiteUrl.includes('?') ? '&' : '?';
                window.open(`${liveSiteUrl}${separator}v=${encodeURIComponent(String(cacheBuster))}`, '_blank', 'noreferrer');
            }
        } else {
            alert(res.error?.message || 'Publish failed. Please try again.');
            await loadPublishReadiness();
        }
        setPublishing(false);
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

    if (!currentInstance) {
        return (
            <div className="be-card flex min-h-[320px] items-center justify-center p-6">
                <div className="space-y-2 text-center">
                    <p className="text-sm text-slate-500">Select a website to start building.</p>
                    <p className="text-xs text-slate-400">
                        Instance means one website. Each connected custom domain points to one website.
                    </p>
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
        <div className="flex h-full overflow-hidden rounded-none border-y border-[#5048e5]/10 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <aside className={`${isLeftPanelOpen ? 'w-72' : 'w-14'} flex shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-slate-900`}>
                <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-700">
                    {isLeftPanelOpen && <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Builder</h2>}
                    <button
                        type="button"
                        onClick={() => setIsLeftPanelOpen((prev) => !prev)}
                        className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#5048e5] dark:hover:bg-slate-800"
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
                                        if (!homePageExists) {
                                            void handleCreatePage();
                                            return;
                                        }
                                        setShowNewPage(true);
                                    }}
                                    disabled={!canCreateHomePage && !canCreateAdditionalPages}
                                    className="rounded-md p-1 text-[#5048e5] transition-colors hover:bg-[#5048e5]/10 disabled:cursor-not-allowed disabled:opacity-40"
                                    title={
                                        pageLimitReached
                                            ? 'Page limit reached for this plan'
                                            : !homePageExists
                                                ? 'Create Home page first'
                                                : !canCreateAdditionalPages
                                                    ? 'Set up Home page first'
                                                    : 'Create page'
                                    }
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            {!homePageExists && (
                                <div className="mb-3 rounded-xl border border-dashed border-[#5048e5]/35 bg-[#5048e5]/5 px-3 py-3">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Start with your Home page</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Create Home (/) first, then apply a template or add sections.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => void handleCreatePage()}
                                        disabled={!canCreateHomePage}
                                        className="mt-3 inline-flex rounded-lg bg-[#5048e5] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#433bcf] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {pageLimitReached ? 'Page Limit Reached' : 'Create Home Page'}
                                    </button>
                                </div>
                            )}

                            {homePageExists && showNewPage && (
                                <div className="mb-3 space-y-2">
                                    <input
                                        type="text"
                                        value={newPageTitle}
                                        onChange={(e) => setNewPageTitle(e.target.value)}
                                        placeholder="Page title (About, Team, Services...)"
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
                                        autoFocus
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        {PAGE_TITLE_SUGGESTIONS.map((suggestedTitle) => (
                                            <button
                                                key={suggestedTitle}
                                                type="button"
                                                onClick={() => setNewPageTitle(suggestedTitle)}
                                                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-[#5048e5]/40 hover:text-[#5048e5] dark:border-slate-700 dark:text-slate-300"
                                            >
                                                {suggestedTitle}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCreatePage}
                                            disabled={!canCreateAdditionalPages}
                                            className="rounded-lg bg-[#5048e5] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#433bcf]"
                                        >
                                            {pageLimitReached ? 'Page Limit Reached' : 'Add Page'}
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
                                {homePageExists && !homePageReadyForAdditionalPages && (
                                    <div className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1.5 text-xs text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300">
                                        Apply a template or add sections to the Home page first. This unlocks additional pages.
                                    </div>
                                )}
                                {pages.map((page) => {
                                    const active = selectedPageId === page.id;
                                    const isHomePage = page.slug === '/';

                                    return (
                                        <div
                                            key={page.id}
                                            className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors ${
                                                active
                                                    ? 'border-[#5048e5]/30 bg-[#5048e5]/10 text-[#5048e5]'
                                                    : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPageId(page.id);
                                                    setSelectedSectionId(null);
                                                    setShowSettings(false);
                                                }}
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
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${active ? 'bg-[#5048e5]/20 text-[#5048e5]' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                    {page.sectionCount}
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeletePage(page.id)}
                                                disabled={isHomePage}
                                                className={`rounded-md p-1 transition-colors ${
                                                    isHomePage
                                                        ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                                                        : active ? 'text-[#5048e5] hover:bg-[#5048e5]/15' : 'text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-700'
                                                }`}
                                                title={isHomePage ? 'Home page cannot be deleted' : 'Delete page'}
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
                                    onClick={() => setThemePickerOpen(true)}
                                    disabled={!selectedPageId}
                                    className="rounded-md p-1 text-[#5048e5] transition-colors hover:bg-[#5048e5]/10 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Add section"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {sections.length === 0 ? (
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
                                                        ? 'border-[#5048e5]/30 bg-[#5048e5]/10'
                                                        : 'border-slate-200 bg-slate-50 hover:border-[#5048e5]/20 hover:bg-[#5048e5]/5 dark:border-slate-700 dark:bg-slate-800'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openSectionInspector(section.id)}
                                                        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left"
                                                    >
                                                        <GripVertical className={`h-4 w-4 shrink-0 ${active ? 'text-[#5048e5]' : 'text-slate-400'}`} />
                                                        <FileText className={`h-4 w-4 shrink-0 ${active ? 'text-[#5048e5]' : 'text-slate-400'}`} />
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
                                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                    showSettings
                                        ? 'bg-[#5048e5] text-white'
                                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Settings2 className="h-4 w-4" />
                                Website Settings
                            </button>
                            <button
                                type="button"
                                onClick={() => setTemplatePickerOpen(true)}
                                disabled={!selectedPageId}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <LayoutTemplate className="h-4 w-4" />
                                Apply Template
                            </button>
                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={publishing || publishBlockedByPlan}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#5048e5] px-3 py-2 text-sm font-semibold text-white shadow-md shadow-[#5048e5]/20 transition hover:bg-[#433bcf] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Upload className="h-4 w-4" />
                                {publishing ? 'Publishing...' : publishBlockedByPlan ? 'Upgrade Required to Publish' : 'Publish Website'}
                            </button>
                            {publishBlockedByPlan && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                                    {publishReadiness?.message || 'This website uses premium themes and cannot be published on your current plan.'}
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
                            onClick={() => setThemePickerOpen(true)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Add section"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={openWebsiteSettingsInspector}
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
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5048e5]">Editing Page</p>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedPage?.title || 'Select a Page'}</h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode('desktop')}
                                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                                        previewMode === 'desktop'
                                            ? 'bg-[#5048e5] text-white'
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
                                            ? 'bg-[#5048e5] text-white'
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
                                onClick={() => setTemplatePickerOpen(true)}
                                disabled={!selectedPageId}
                                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Use Template
                            </button>
                            <button
                                type="button"
                                onClick={() => setThemePickerOpen(true)}
                                disabled={!selectedPageId}
                                className="rounded-md bg-[#5048e5] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#433bcf] disabled:cursor-not-allowed disabled:opacity-50"
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
                    <div className={`mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-700 dark:bg-slate-900 ${previewMode === 'mobile' ? 'max-w-[430px]' : 'w-full'}`}>
                        {sections.length === 0 && selectedPageId && (
                            <div className="px-6 py-20 text-center">
                                <p className="mb-4 text-base text-slate-500 dark:text-slate-400">This page has no sections yet.</p>
                                <div className="flex flex-wrap justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setTemplatePickerOpen(true)}
                                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                        Choose Template
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setThemePickerOpen(true)}
                                        className="rounded-lg bg-[#5048e5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#433bcf]"
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
                                        ? 'outline-[#5048e5] ring-2 ring-[#5048e5]/20'
                                        : 'outline-transparent hover:outline-[#5048e5]/35'
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
                                    } : undefined}
                                />
                            </div>
                        ))}

                        {sections.length > 0 && (
                            <div className="border-t border-dashed border-slate-200 px-6 py-8 text-center dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setThemePickerOpen(true)}
                                    className="rounded-lg border-2 border-dashed border-[#5048e5]/40 bg-[#5048e5]/5 px-5 py-2 text-sm font-semibold text-[#5048e5] transition hover:bg-[#5048e5]/10"
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
                                            ? 'bg-white text-[#5048e5] shadow-sm dark:bg-slate-700'
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
                                            ? 'bg-white text-[#5048e5] shadow-sm dark:bg-slate-700'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    Theme
                                </button>
                            </div>

                            {!showSettings && selectedSection && (
                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleMoveSection(selectedSection.id, 'up')}
                                        disabled={selectedSectionIndex <= 0}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <ChevronUp className="h-3.5 w-3.5" />
                                        Up
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleMoveSection(selectedSection.id, 'down')}
                                        disabled={selectedSectionIndex >= sections.length - 1}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <ChevronDown className="h-3.5 w-3.5" />
                                        Down
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteSection(selectedSection.id)}
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
                                <SettingsPanel settings={settings} onSave={handleSaveSettings} saving={settingsSaving} />
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
                                </div>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                                    <div className="mb-3 rounded-full bg-[#5048e5]/10 p-3 text-[#5048e5]">
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

            <ThemePicker
                open={themePickerOpen}
                onClose={() => setThemePickerOpen(false)}
                onSelect={handleAddSection}
                maxAccessibleThemes={publishReadiness?.maxAccessibleThemes ?? null}
                disallowedComponentKeys={existingGlobalLayoutKeys}
            />
            <TemplatePicker open={templatePickerOpen} onClose={() => setTemplatePickerOpen(false)} onSelect={handleApplyTemplate} />
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

function SettingsPanel({ settings, onSave, saving }: {
    settings: WebsiteSettings | null;
    onSave: (settings: Partial<WebsiteSettings>) => void;
    saving: boolean;
}) {
    const [tokens, setTokens] = useState<WebsiteSettings['tokens']>(settings?.tokens || DEFAULT_TOKENS);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(findMatchingTemplateId(settings?.tokens || DEFAULT_TOKENS));

    useEffect(() => {
        if (!settings?.tokens) return;
        setTokens(settings.tokens);
        setSelectedTemplateId(findMatchingTemplateId(settings.tokens));
    }, [settings]);

    const handleSave = () => {
        onSave({ tokens });
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

    const activeTemplate = selectedTemplateId ? THEME_TEMPLATES.find((template) => template.id === selectedTemplateId) : null;
    const fontSuggestions = Array.from(new Set([...(activeTemplate?.fontSuggestions || []), ...DEFAULT_FONT_SUGGESTIONS, tokens.font]));

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
