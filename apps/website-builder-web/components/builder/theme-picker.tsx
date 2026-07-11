'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api-client';
import { SectionRenderer } from './section-renderer';

export interface ThemeCatalogTheme {
    id: string;
    name: string;
    slug: string;
    componentKey: string;
    version: number;
    accessRank: number;
    previewImageUrl: string | null;
    defaultStylesJsonb?: Record<string, unknown> | null;
    isPlanRestricted?: boolean;
    feature: { id: string; name: string; slug: string };
}

interface ThemePickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (theme: ThemeCatalogTheme) => void;
    disallowedComponentKeys?: string[];
    disallowedFeatureSlugs?: string[];
    mode?: 'add' | 'replace';
    replaceTarget?: {
        sectionId: string;
        themeId: string;
        featureSlug?: string;
        featureName?: string;
    } | null;
}

const PREVIEW_TOKENS = {
    primary: '#dc2626',
    secondary: '#e2e8f0',
    accent: '#ef4444',
    text: '#0f172a',
    background: '#ffffff',
    font: '"Inter", sans-serif',
};

function buildPreviewContent(theme: ThemeCatalogTheme): Record<string, unknown> {
    const featureSlug = theme.feature.slug;

    switch (featureSlug) {
        case 'header':
            return {
                businessName: 'Preview Brand',
                menu: [{ label: 'Services', href: '#services' }],
                ctaText: 'Book',
                ctaLink: '#booking-widget',
            };
        case 'hero':
            return {
                title: `${theme.name} Preview`,
                subtitle: 'Responsive section preview in builder mode.',
                ctaText: 'Book Now',
                ctaLink: '#booking-widget',
            };
        case 'about':
            return {
                title: `${theme.name} Preview`,
                body: 'This is a live preview of the section style and layout.',
            };
        case 'services':
            return {
                title: `${theme.name} Preview`,
                subtitle: 'Services are previewed with fallback sample content.',
                showSelectButton: true,
            };
        case 'product':
            return {
                title: `${theme.name} Preview`,
                subtitle: 'Products are previewed with fallback sample content.',
                showAllProducts: true,
                featuredCount: 3,
            };
        case 'blog':
            return {
                title: `${theme.name} Preview`,
                subtitle: 'Blogs are previewed with fallback sample content.',
                showAllPosts: true,
                featuredCount: 3,
            };
        case 'gallery':
            return {
                title: `${theme.name} Preview`,
                subtitle: 'Gallery style preview',
            };
        case 'testimonials':
            return {
                title: `${theme.name} Preview`,
                subtitle: 'Customer testimonial layout preview',
            };
        case 'contact':
            return {
                title: `${theme.name} Preview`,
                subtitle: 'Inquiry form layout preview',
                email: 'hello@example.com',
                phone: '+1 (555) 123-4567',
            };
        case 'footer':
            return {
                businessName: 'Preview Brand',
                text: 'Footer preview copy for visual review.',
            };
        case 'booking-widget':
            return {
                title: `${theme.name} Preview`,
                helperText: 'Booking flow preview',
                ctaText: 'Book Now',
                showServices: true,
                showDatePicker: true,
            };
        case 'pricing':
            return {
                title: `${theme.name} Preview`,
                subtitle: 'Pricing table preview',
            };
        case 'faq':
            return {
                title: `${theme.name} Preview`,
            };
        case 'team':
            return {
                title: `${theme.name} Preview`,
                subtitle: 'Team section style preview',
            };
        default:
            return {};
    }
}

export function ThemePicker({
    open,
    onClose,
    onSelect,
    disallowedComponentKeys = [],
    disallowedFeatureSlugs = [],
    mode = 'add',
    replaceTarget = null,
}: ThemePickerProps) {
    const [themes, setThemes] = useState<ThemeCatalogTheme[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

    useEffect(() => {
        if (!open) {
            setSelectedThemeId(null);
            setPreviewMode('desktop');
            return;
        }

        setLoading(true);
        api.get<ThemeCatalogTheme[]>('/cms/catalog/themes')
            .then((res) => {
                if (res.success && res.data) {
                    setThemes(res.data);
                }
            })
            .finally(() => setLoading(false));
    }, [open]);

    const visibleThemes = useMemo(() => {
        if (mode === 'replace' && replaceTarget?.featureSlug) {
            return themes.filter((theme) => theme.feature.slug === replaceTarget.featureSlug);
        }
        return themes;
    }, [themes, mode, replaceTarget?.featureSlug]);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (visibleThemes.length === 0) {
            setSelectedThemeId(null);
            return;
        }

        setSelectedThemeId((current) => (
            current && visibleThemes.some((theme) => theme.id === current)
                ? current
                : visibleThemes[0]!.id
        ));
    }, [open, visibleThemes]);

    const selectedTheme = useMemo(
        () => visibleThemes.find((theme) => theme.id === selectedThemeId) || null,
        [visibleThemes, selectedThemeId],
    );
    const selectedThemePreviewContent = useMemo(
        () => (selectedTheme ? buildPreviewContent(selectedTheme) : {}),
        [selectedTheme],
    );
    const selectedThemePreviewStyles = useMemo(
        () => {
            if (!selectedTheme?.defaultStylesJsonb || typeof selectedTheme.defaultStylesJsonb !== 'object') {
                return {};
            }
            return selectedTheme.defaultStylesJsonb;
        },
        [selectedTheme],
    );

    const isThemeBlocked = (theme: ThemeCatalogTheme): boolean => (
        mode === 'add'
        && (disallowedComponentKeys.includes(theme.componentKey) || disallowedFeatureSlugs.includes(theme.feature.slug))
    );
    const isCurrentThemeForSelectedSection = (theme: ThemeCatalogTheme): boolean => (
        mode === 'replace'
        && replaceTarget !== null
        && replaceTarget.themeId === theme.id
    );
    const pickerTitle = mode === 'replace' ? 'Change Section Theme' : 'Choose a Theme';
    const pickerDescription = mode === 'replace'
        ? 'Select a theme for this section. Only matching section types are shown.'
        : 'Select a section theme, preview it, then apply it to this page.';

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[2000] bg-slate-950/80"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="flex h-full w-full flex-col bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{pickerTitle}</h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {pickerDescription}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        aria-label="Close theme picker"
                    >
                        &times;
                    </button>
                </div>

                <div className="min-h-0 flex flex-1 flex-col lg:flex-row">
                    <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:w-[420px] lg:border-b-0 lg:border-r lg:p-5">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Available Themes
                        </p>

                        {loading ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">Loading available sections...</p>
                        ) : visibleThemes.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {mode === 'replace'
                                    ? 'No compatible themes are available for this section.'
                                    : 'No themes available.'}
                            </p>
                        ) : (
                            <div className="max-h-[36vh] space-y-4 overflow-y-auto pr-1 lg:max-h-[calc(100vh-210px)]">
                                {Object.entries(visibleThemes.reduce<Record<string, ThemeCatalogTheme[]>>((acc, theme) => {
                                    const key = theme.feature.name;
                                    if (!acc[key]) acc[key] = [];
                                    acc[key]!.push(theme);
                                    return acc;
                                }, {})).map(([featureName, featureThemes]) => (
                                    <div key={featureName}>
                                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            {featureName}
                                        </p>
                                        <div className="space-y-2">
                                            {featureThemes.map((theme) => {
                                                const selected = theme.id === selectedTheme?.id;
                                                const blocked = isThemeBlocked(theme);

                                                return (
                                                    <button
                                                        key={theme.id}
                                                        type="button"
                                                        onClick={() => setSelectedThemeId(theme.id)}
                                                        className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                                                            selected
                                                                ? 'border-[#dc2626] bg-[#dc2626]/10'
                                                                : 'border-slate-200 bg-white hover:border-[#dc2626]/50 dark:border-slate-700 dark:bg-slate-900'
                                                        }`}
                                                    >
                                                        <div
                                                            className="h-14 w-20 shrink-0 rounded-md bg-slate-100 bg-cover bg-center dark:bg-slate-800"
                                                            style={{ backgroundImage: `url(${theme.previewImageUrl || ''})` }}
                                                        >
                                                            {!theme.previewImageUrl && (
                                                                <div className="flex h-full items-center justify-center text-[10px] text-slate-400 dark:text-slate-500">
                                                                    No Preview
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{theme.name}</p>
                                                            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                                                {theme.componentKey} · v{theme.version}
                                                            </p>
                                                            {blocked && (
                                                                <span className="mt-1 inline-flex rounded-md border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                    Already added
                                                                </span>
                                                            )}
                                                            {!blocked && isCurrentThemeForSelectedSection(theme) && (
                                                                <span className="mt-1 inline-flex rounded-md border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                    Current theme
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </aside>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
                        {loading ? (
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400">Loading theme preview...</p>
                        ) : !selectedTheme ? (
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400">Select a theme to preview.</p>
                        ) : (
                            <div className="mx-auto max-w-6xl space-y-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Preview
                                        </p>
                                        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                                            <button
                                                type="button"
                                                onClick={() => setPreviewMode('desktop')}
                                                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                                                    previewMode === 'desktop'
                                                        ? 'bg-[#dc2626] text-white'
                                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                Web
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPreviewMode('mobile')}
                                                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                                                    previewMode === 'mobile'
                                                        ? 'bg-[#dc2626] text-white'
                                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                Mobile
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`relative mx-auto w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 ${previewMode === 'mobile' ? 'max-w-[430px]' : ''}`}>
                                        {selectedTheme.previewImageUrl ? (
                                            <div className="relative aspect-[16/9] w-full">
                                                <img
                                                    src={selectedTheme.previewImageUrl}
                                                    alt={`${selectedTheme.name} preview`}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-[60vh] min-h-[320px] overflow-y-auto bg-white sm:min-h-[420px]">
                                                <SectionRenderer
                                                    componentKey={selectedTheme.componentKey}
                                                    content={selectedThemePreviewContent}
                                                    styles={selectedThemePreviewStyles}
                                                    tokens={PREVIEW_TOKENS}
                                                    isEditor={false}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:p-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedTheme.name}</h3>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                {selectedTheme.feature.name} · {selectedTheme.componentKey} · v{selectedTheme.version}
                                            </p>
                                            {isThemeBlocked(selectedTheme) && (
                                                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                                                    This theme section is already used on the current page.
                                                </p>
                                            )}
                                            {!isThemeBlocked(selectedTheme) && isCurrentThemeForSelectedSection(selectedTheme) && (
                                                <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                                                    This section already uses the selected theme.
                                                </p>
                                            )}
                                            {mode === 'replace' && replaceTarget?.featureName && (
                                                <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                                                    Editing: {replaceTarget.featureName} section
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!selectedTheme || isThemeBlocked(selectedTheme) || isCurrentThemeForSelectedSection(selectedTheme)) {
                                                    return;
                                                }
                                                onSelect(selectedTheme);
                                                onClose();
                                            }}
                                            disabled={isThemeBlocked(selectedTheme) || isCurrentThemeForSelectedSection(selectedTheme)}
                                            className="inline-flex items-center justify-center rounded-lg bg-[#dc2626] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isThemeBlocked(selectedTheme)
                                                ? 'Already Added'
                                                : isCurrentThemeForSelectedSection(selectedTheme)
                                                    ? 'Current Theme'
                                                    : mode === 'replace'
                                                        ? 'Apply to Section'
                                                        : 'Apply Theme'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
