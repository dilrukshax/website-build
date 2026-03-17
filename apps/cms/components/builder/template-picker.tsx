'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api-client';

interface PageTemplate {
    id: string;
    name: string;
    description: string | null;
    previewImageUrl: string | null;
    isPremium: boolean;
    isPlanRestricted?: boolean;
}

interface TemplatePickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (templateId: string) => void;
}

export function TemplatePicker({ open, onClose, onSelect }: TemplatePickerProps) {
    const [templates, setTemplates] = useState<PageTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setLoading(true);
            api.get<PageTemplate[]>('/cms/catalog/page-templates')
                .then(res => {
                    if (res.success && res.data) {
                        setTemplates(res.data);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [open]);

    useEffect(() => {
        if (!open) {
            setSelectedTemplateId(null);
            return;
        }

        if (templates.length === 0) {
            setSelectedTemplateId(null);
            return;
        }

        setSelectedTemplateId((current) => (
            current && templates.some((template) => template.id === current)
                ? current
                : templates[0]!.id
        ));
    }, [open, templates]);

    if (!open) return null;

    const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-slate-950/80"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="flex h-full w-full flex-col bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Choose a Page Template</h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Preview any template in full screen, then apply it to this page.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        aria-label="Close template picker"
                    >
                        &times;
                    </button>
                </div>

                <div className="min-h-0 flex flex-1 flex-col lg:flex-row">
                    <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:w-[360px] lg:border-b-0 lg:border-r lg:p-5">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Small Previews
                        </p>
                        <div className="max-h-[32vh] space-y-3 overflow-y-auto pr-1 lg:max-h-[calc(100vh-210px)]">
                            {templates.map((template) => {
                                const selected = template.id === selectedTemplate?.id;
                                return (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => setSelectedTemplateId(template.id)}
                                        className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                                            selected
                                                ? 'border-[#5048e5] bg-[#5048e5]/10'
                                                : 'border-slate-200 bg-white hover:border-[#5048e5]/50 dark:border-slate-700 dark:bg-slate-900'
                                        }`}
                                    >
                                        <div
                                            className="h-16 w-24 shrink-0 rounded-md bg-slate-100 bg-cover bg-center dark:bg-slate-800"
                                            style={{ backgroundImage: `url(${template.previewImageUrl || ''})` }}
                                        >
                                            {!template.previewImageUrl && (
                                                <div className="flex h-full items-center justify-center text-[10px] text-slate-400 dark:text-slate-500">
                                                    No Preview
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center gap-1.5">
                                                <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{template.name}</span>
                                                {template.isPremium && (
                                                    <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300">
                                                        Premium
                                                    </span>
                                                )}
                                            </div>
                                            <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                                {template.description || 'No description provided.'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
                        {loading ? (
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400">Loading templates...</p>
                        ) : templates.length === 0 ? (
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400">No templates available.</p>
                        ) : selectedTemplate ? (
                            <div className="mx-auto max-w-6xl space-y-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:p-4">
                                    <div
                                        className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                                        style={{ backgroundImage: `url(${selectedTemplate.previewImageUrl || ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                    >
                                        {!selectedTemplate.previewImageUrl && (
                                            <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                                                No Preview Available
                                            </div>
                                        )}
                                        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                                            {selectedTemplate.isPremium && (
                                                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300">
                                                    Premium
                                                </span>
                                            )}
                                            {selectedTemplate.isPlanRestricted && (
                                                <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:border-sky-900/30 dark:bg-sky-950/30 dark:text-sky-300">
                                                    Preview Only
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:p-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <div className="mb-1 flex items-center gap-2">
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedTemplate.name}</h3>
                                                {selectedTemplate.isPremium && (
                                                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300">
                                                        Premium
                                                    </span>
                                                )}
                                            </div>
                                            <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                                {selectedTemplate.description || 'No description provided.'}
                                            </p>
                                            {selectedTemplate.isPlanRestricted && (
                                                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                                                    You can apply this template for editing and preview, but publishing will require a premium plan.
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => onSelect(selectedTemplate.id)}
                                            className="inline-flex items-center justify-center rounded-lg bg-[#5048e5] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#433bcf]"
                                        >
                                            Apply This Template
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    Select any template to preview it in full screen. Premium templates can be selected even on restricted plans.
                </div>
            </div>
        </div>
    );
}
