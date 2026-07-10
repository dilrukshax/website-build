'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Code2,
    ExternalLink,
    FileCode2,
    Loader2,
    Save,
    Settings2,
} from 'lucide-react';
import { useAuth } from '../../../contexts/auth-context';
import { api } from '../../../lib/api-client';
import { getInstanceDisplayDomain } from '../../../lib/domain';

interface WebsiteCustomCodeSettings {
    head?: string | null;
    bodyTop?: string | null;
    bodyBottom?: string | null;
}

interface WebsiteSettings {
    customCode?: WebsiteCustomCodeSettings | null;
}

const EMPTY_CUSTOM_CODE: Required<Record<keyof WebsiteCustomCodeSettings, string>> = {
    head: '',
    bodyTop: '',
    bodyBottom: '',
};

const CODE_FIELDS = [
    {
        key: 'head',
        label: 'Head HTML',
        output: '<head>',
        rows: 7,
        placeholder:
            '<meta name="google-site-verification" content="..." />\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>',
        guidance: 'Use for verification meta tags, analytics bootstrap scripts, publisher tags, and Open Graph overrides.',
    },
    {
        key: 'bodyTop',
        label: 'Body HTML',
        output: 'after <body>',
        rows: 6,
        placeholder:
            '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>',
        guidance: 'Use for noscript fallbacks, top-of-body widgets, and tracking containers that require body placement.',
    },
    {
        key: 'bodyBottom',
        label: 'Footer HTML',
        output: 'before </body>',
        rows: 6,
        placeholder: '<script src="https://cdn.example.com/widget.js" defer></script>',
        guidance: 'Use for deferred scripts, chat widgets, and footer-level embeds that should load after page content.',
    },
] as const;

type CodeFieldKey = (typeof CODE_FIELDS)[number]['key'];
type CustomCodeForm = Record<CodeFieldKey, string>;

function normalizeCustomCodeForForm(settings: WebsiteSettings | null): CustomCodeForm {
    return {
        head: settings?.customCode?.head || '',
        bodyTop: settings?.customCode?.bodyTop || '',
        bodyBottom: settings?.customCode?.bodyBottom || '',
    };
}

function trimCustomCodeForSave(customCode: CustomCodeForm): CustomCodeForm {
    return {
        head: customCode.head.trim(),
        bodyTop: customCode.bodyTop.trim(),
        bodyBottom: customCode.bodyBottom.trim(),
    };
}

function hasMetaTag(value: string): boolean {
    return /<meta(?:\s|>|\/)/i.test(value);
}

function hasBodyWrapper(value: string): boolean {
    return /<\/?(?:html|head|body)(?:\s|>|\/)/i.test(value);
}

function getLiveSiteUrl(host: string): string | null {
    const trimmed = host.trim();
    if (!trimmed) {
        return null;
    }
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function WebsiteSettingsPage() {
    const { currentInstance } = useAuth();
    const [customCode, setCustomCode] = useState<CustomCodeForm>(EMPTY_CUSTOM_CODE);
    const [lastSavedCustomCode, setLastSavedCustomCode] = useState<CustomCodeForm>(EMPTY_CUSTOM_CODE);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const displayDomain = getInstanceDisplayDomain(currentInstance);
    const liveSiteUrl = getLiveSiteUrl(displayDomain);
    const isDirty = JSON.stringify(customCode) !== JSON.stringify(lastSavedCustomCode);

    const bodyMetaWarnings = useMemo(() => {
        const warnings: Partial<Record<CodeFieldKey, string>> = {};
        if (hasMetaTag(customCode.bodyTop)) {
            warnings.bodyTop = 'Meta tags should be moved to Head HTML for reliable verification.';
        }
        if (hasMetaTag(customCode.bodyBottom)) {
            warnings.bodyBottom = 'Meta tags should be moved to Head HTML for reliable verification.';
        }
        return warnings;
    }, [customCode.bodyTop, customCode.bodyBottom]);

    const wrapperNotices = useMemo(() => {
        const notices: Partial<Record<CodeFieldKey, string>> = {};
        for (const field of CODE_FIELDS) {
            if (hasBodyWrapper(customCode[field.key])) {
                notices[field.key] = 'Pasted html/head/body wrappers are accepted and stripped during publish rendering.';
            }
        }
        return notices;
    }, [customCode]);

    useEffect(() => {
        let isMounted = true;

        async function loadSettings() {
            setIsLoading(true);
            setError('');
            setMessage('');

            const res = await api.get<{ settings: WebsiteSettings }>('/cms/builder/settings');
            if (!isMounted) {
                return;
            }

            if (res.success && res.data) {
                const nextSettings = res.data.settings || {};
                const nextCustomCode = normalizeCustomCodeForForm(nextSettings);
                setCustomCode(nextCustomCode);
                setLastSavedCustomCode(nextCustomCode);
            } else {
                setError(res.error?.message || 'Failed to load website settings.');
            }

            setIsLoading(false);
        }

        if (currentInstance) {
            void loadSettings();
        } else {
            setCustomCode(EMPTY_CUSTOM_CODE);
            setLastSavedCustomCode(EMPTY_CUSTOM_CODE);
            setIsLoading(false);
        }

        return () => {
            isMounted = false;
        };
    }, [currentInstance?.id]);

    function updateCustomCodeField(key: CodeFieldKey, value: string) {
        setCustomCode((prev) => ({
            ...prev,
            [key]: value,
        }));
        setMessage('');
        setError('');
    }

    function resetChanges() {
        setCustomCode(lastSavedCustomCode);
        setMessage('');
        setError('');
    }

    async function saveSettings() {
        setIsSaving(true);
        setMessage('');
        setError('');

        const nextCustomCode = trimCustomCodeForSave(customCode);
        const res = await api.put<{ settings: WebsiteSettings }>('/cms/builder/settings', {
            customCode: nextCustomCode,
        });

        if (res.success && res.data) {
            const nextSettings = res.data.settings || {};
            const savedCustomCode = normalizeCustomCodeForForm(nextSettings);
            setCustomCode(savedCustomCode);
            setLastSavedCustomCode(savedCustomCode);
            setMessage('Website settings saved. Republish the website to update the live source.');
        } else {
            setError(res.error?.message || 'Failed to save website settings.');
        }

        setIsSaving(false);
    }

    if (!currentInstance) {
        return (
            <div className="be-card flex min-h-[320px] items-center justify-center p-6 text-center">
                <div>
                    <Settings2 className="mx-auto mb-3 h-8 w-8 text-[#2563eb]" />
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Select a website</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Choose an active website from the switcher before editing custom code.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#2563eb]/15 bg-[#2563eb]/5 px-3 py-1 text-xs font-semibold text-[#2563eb]">
                        <Settings2 className="h-3.5 w-3.5" />
                        Website Settings
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Custom Code</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                        Add published-site snippets for the selected website. These values are saved to website settings and included in the next publish manifest.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {liveSiteUrl && (
                        <Link
                            href={liveSiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View Site
                        </Link>
                    )}
                    <Link
                        href="/dashboard/builder"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <FileCode2 className="h-4 w-4" />
                        Open Builder
                    </Link>
                </div>
            </div>

            <section className="be-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">{currentInstance.name}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {displayDomain || 'No domain configured'}
                        </p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                        Save changes, then publish to update live HTML.
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <section className="be-card overflow-hidden">
                    <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <Code2 className="h-5 w-5 text-[#2563eb]" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Published HTML Slots</h2>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex min-h-[360px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading website settings...
                        </div>
                    ) : (
                        <div className="space-y-5 p-5">
                            {CODE_FIELDS.map((field) => (
                                <div key={field.key}>
                                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                                        <label
                                            htmlFor={`custom-code-${field.key}`}
                                            className="text-sm font-bold text-slate-900 dark:text-white"
                                        >
                                            {field.label}
                                        </label>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                            {field.output}
                                        </span>
                                    </div>
                                    <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{field.guidance}</p>
                                    <textarea
                                        id={`custom-code-${field.key}`}
                                        value={customCode[field.key]}
                                        onChange={(event) => updateCustomCodeField(field.key, event.target.value)}
                                        rows={field.rows}
                                        spellCheck={false}
                                        placeholder={field.placeholder}
                                        className="min-h-[132px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm leading-6 text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    {bodyMetaWarnings[field.key] && (
                                        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            <span>{bodyMetaWarnings[field.key]}</span>
                                        </div>
                                    )}
                                    {wrapperNotices[field.key] && (
                                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            {wrapperNotices[field.key]}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {message && (
                                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{message}</span>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={resetChanges}
                                    disabled={!isDirty || isSaving}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Reset Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void saveSettings()}
                                    disabled={isSaving || !isDirty}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/25 transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {isSaving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <aside className="space-y-4">
                    <section className="be-card p-5">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Slot Rules</h2>
                        <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                            <div>
                                <div className="font-semibold text-slate-900 dark:text-white">Head HTML</div>
                                <p className="mt-1">Verification meta tags and analytics bootstrap scripts belong here.</p>
                            </div>
                            <div>
                                <div className="font-semibold text-slate-900 dark:text-white">Body HTML</div>
                                <p className="mt-1">Top-of-body snippets such as GTM noscript fallbacks belong here.</p>
                            </div>
                            <div>
                                <div className="font-semibold text-slate-900 dark:text-white">Footer HTML</div>
                                <p className="mt-1">Deferred scripts and widgets that should load after content belong here.</p>
                            </div>
                        </div>
                    </section>

                    <section className="be-card p-5">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Publish Flow</h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            The live website reads these fields from the published manifest. Saving updates draft settings; publishing updates source HTML.
                        </p>
                        <Link
                            href="/dashboard/builder"
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Go to Publish
                        </Link>
                    </section>
                </aside>
            </div>
        </div>
    );
}
