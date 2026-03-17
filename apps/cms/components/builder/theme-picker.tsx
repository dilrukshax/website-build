'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api-client';

export interface ThemeCatalogTheme {
    id: string;
    name: string;
    slug: string;
    componentKey: string;
    version: number;
    accessRank: number;
    previewImageUrl: string | null;
    isPlanRestricted?: boolean;
    feature: { id: string; name: string; slug: string };
}

interface ThemePickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (theme: ThemeCatalogTheme) => void;
    maxAccessibleThemes: number | null;
    disallowedComponentKeys?: string[];
}

export function ThemePicker({ open, onClose, onSelect, maxAccessibleThemes, disallowedComponentKeys = [] }: ThemePickerProps) {
    const [themes, setThemes] = useState<ThemeCatalogTheme[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            api.get<ThemeCatalogTheme[]>('/cms/catalog/themes?includePremiumPreview=true')
                .then((res) => {
                    if (res.success && res.data) {
                        setThemes(res.data);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [open]);

    if (!open) return null;

    // Group themes by feature
    const grouped = themes.reduce<Record<string, ThemeCatalogTheme[]>>((acc, theme) => {
        const key = theme.feature.name;
        if (!acc[key]) acc[key] = [];
        acc[key]!.push(theme);
        return acc;
    }, {});

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
                <div className="flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-700 dark:bg-slate-900">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Add a New Section</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Choose a pre-built section layout to add to your page.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        aria-label="Close section picker"
                    >
                        ×
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-base text-slate-500 dark:text-slate-400">Loading available sections...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(grouped).map(([featureName, featureThemes]) => (
                                <div key={featureName}>
                                    <h3 className="mb-4 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                        {featureName}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                        {featureThemes.map((theme) => {
                                            const blockedByLayoutRule = disallowedComponentKeys.includes(theme.componentKey);
                                            const restrictedByPlan = theme.isPlanRestricted
                                                ?? (maxAccessibleThemes !== null && theme.accessRank > maxAccessibleThemes);
                                            const disabled = blockedByLayoutRule;

                                            return (
                                                <button
                                                    key={theme.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (disabled) {
                                                            return;
                                                        }
                                                        onSelect(theme);
                                                        onClose();
                                                    }}
                                                    disabled={disabled}
                                                    className={`group overflow-hidden rounded-xl border text-left shadow-sm transition-all ${
                                                        disabled
                                                            ? 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-70 dark:border-slate-700 dark:bg-slate-800'
                                                            : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900'
                                                    }`}
                                                >
                                                    <div className="relative h-40 border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                                        {theme.previewImageUrl ? (
                                                            <img
                                                                src={theme.previewImageUrl}
                                                                alt={`${theme.name} preview`}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-500">
                                                                <svg
                                                                    width="48"
                                                                    height="48"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="1.5"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                >
                                                                    <rect width="18" height="18" x="3" y="3" rx="2" />
                                                                    <path d="M3 9h18" />
                                                                    <path d="M9 21V9" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{theme.name}</div>
                                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            v{theme.version} · {theme.componentKey} · Rank {theme.accessRank}
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {restrictedByPlan && (
                                                                <span className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
                                                                    Premium Preview
                                                                </span>
                                                            )}
                                                            {blockedByLayoutRule ? (
                                                                <span className="inline-flex rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                    Already added
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
                                                                    + Add Section
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
