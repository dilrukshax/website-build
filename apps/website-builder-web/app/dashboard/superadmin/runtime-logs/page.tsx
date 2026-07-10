'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, RefreshCw, TerminalSquare } from 'lucide-react';
import { useAuth } from '../../../../contexts/auth-context';
import { api } from '../../../../lib/api-client';

type RuntimeLogSource = 'frontend' | 'backend';
type RuntimeLogSourceFilter = RuntimeLogSource | 'all';

interface RuntimeLogSourceEntry {
    source: RuntimeLogSource;
    label: string;
    available: boolean;
    filePath: string | null;
    updatedAt: string | null;
    lineCount: number;
    content: string;
    note?: string;
}

interface RuntimeLogsPayload {
    source: RuntimeLogSourceFilter;
    linesRequested: number;
    generatedAt: string;
    sources: RuntimeLogSourceEntry[];
}

const REFRESH_INTERVAL_MS = 5000;
const DEFAULT_LINE_LIMIT = 200;

export default function SuperAdminRuntimeLogsPage() {
    const { user } = useAuth();
    const isSuperAdmin = user?.isSuperAdmin === true;

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [logsPayload, setLogsPayload] = useState<RuntimeLogsPayload | null>(null);
    const [lineLimit, setLineLimit] = useState<number>(DEFAULT_LINE_LIMIT);
    const [sourceFilter, setSourceFilter] = useState<RuntimeLogSourceFilter>('all');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const sourceOrder = useMemo<RuntimeLogSource[]>(
        () => (sourceFilter === 'all' ? ['frontend', 'backend'] : [sourceFilter]),
        [sourceFilter],
    );

    const sourceMap = useMemo(() => {
        const lookup = new Map<RuntimeLogSource, RuntimeLogSourceEntry>();
        for (const source of logsPayload?.sources || []) {
            lookup.set(source.source, source);
        }
        return lookup;
    }, [logsPayload]);

    useEffect(() => {
        if (!isSuperAdmin) {
            setIsLoading(false);
            return;
        }

        void fetchRuntimeLogs({ background: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuperAdmin, lineLimit, sourceFilter]);

    useEffect(() => {
        if (!isSuperAdmin || !autoRefresh) {
            return;
        }

        const interval = window.setInterval(() => {
            void fetchRuntimeLogs({ background: true });
        }, REFRESH_INTERVAL_MS);

        return () => window.clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuperAdmin, autoRefresh, lineLimit, sourceFilter]);

    async function fetchRuntimeLogs({ background }: { background: boolean }): Promise<void> {
        if (background) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        setError('');

        const params = new URLSearchParams({ lines: String(lineLimit) });
        if (sourceFilter !== 'all') {
            params.set('source', sourceFilter);
        }

        const response = await api.get<RuntimeLogsPayload>(`/cms/superadmin/runtime-logs?${params.toString()}`);
        if (!response.success || !response.data) {
            setError(response.error?.message || 'Failed to load runtime logs');
            setIsLoading(false);
            setIsRefreshing(false);
            return;
        }

        setLogsPayload(response.data);
        setIsLoading(false);
        setIsRefreshing(false);
    }

    async function copySingleSource(source: RuntimeLogSourceEntry): Promise<void> {
        const text = source.content || source.note || '';
        if (!text) {
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(source.source);
            window.setTimeout(() => setCopiedKey(null), 1500);
        } catch {
            setError(`Failed to copy ${source.label} logs.`);
        }
    }

    async function copyAllSources(): Promise<void> {
        const sections = sourceOrder.map((sourceKey) => {
            const source = sourceMap.get(sourceKey);
            const label = source?.label || sourceKey;
            const payload = source?.content || source?.note || 'No log output available.';
            return `===== ${label} =====\n${payload}`;
        });

        const fullText = sections.join('\n\n');
        if (!fullText.trim()) {
            return;
        }

        try {
            await navigator.clipboard.writeText(fullText);
            setCopiedKey('all');
            window.setTimeout(() => setCopiedKey(null), 1500);
        } catch {
            setError('Failed to copy combined logs.');
        }
    }

    if (!isSuperAdmin) {
        return (
            <div className="be-card p-6">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Runtime Logs</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Super admin access is required for this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Runtime Logs</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Monitor frontend and backend runtime output from one place.
                    </p>
                    {logsPayload?.generatedAt && (
                        <p className="mt-1 text-xs text-slate-400">
                            Last fetched {new Date(logsPayload.generatedAt).toLocaleString()}
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => void fetchRuntimeLogs({ background: false })}
                    disabled={isLoading || isRefreshing}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh now
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            )}

            <section className="be-card p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <label className="text-sm">
                        <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">Source</span>
                        <select
                            value={sourceFilter}
                            onChange={(event) => setSourceFilter(event.target.value as RuntimeLogSourceFilter)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 dark:border-slate-700 dark:bg-slate-900"
                        >
                            <option value="all">Frontend + Backend</option>
                            <option value="frontend">Frontend only</option>
                            <option value="backend">Backend only</option>
                        </select>
                    </label>

                    <label className="text-sm">
                        <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">Lines</span>
                        <select
                            value={String(lineLimit)}
                            onChange={(event) => setLineLimit(Number(event.target.value))}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 dark:border-slate-700 dark:bg-slate-900"
                        >
                            <option value="100">100 lines</option>
                            <option value="200">200 lines</option>
                            <option value="500">500 lines</option>
                            <option value="1000">1000 lines</option>
                        </select>
                    </label>

                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(event) => setAutoRefresh(event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]/30 dark:border-slate-600"
                        />
                        Auto refresh (5s)
                    </label>

                    <button
                        type="button"
                        onClick={copyAllSources}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {copiedKey === 'all' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copiedKey === 'all' ? 'Copied all' : 'Copy all'}
                    </button>
                </div>
            </section>

            {isLoading ? (
                <div className="be-card p-6 text-sm text-slate-500">Loading runtime logs...</div>
            ) : (
                <div className="space-y-5">
                    {sourceOrder.map((sourceKey) => {
                        const source = sourceMap.get(sourceKey);

                        return (
                            <section
                                key={sourceKey}
                                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <TerminalSquare className="h-5 w-5 text-[#2563eb]" />
                                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                {source?.label || (sourceKey === 'frontend' ? 'Frontend (CMS)' : 'Backend (API)')}
                                            </h2>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {source?.filePath || source?.note || 'No log file detected for this source.'}
                                        </p>
                                        {source?.updatedAt && (
                                            <p className="mt-1 text-xs text-slate-400">
                                                Updated {new Date(source.updatedAt).toLocaleString()} • {source.lineCount} lines
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => source && void copySingleSource(source)}
                                        disabled={!source}
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        {copiedKey === sourceKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copiedKey === sourceKey ? 'Copied' : 'Copy log'}
                                    </button>
                                </div>

                                <pre className="mt-4 max-h-[460px] overflow-auto rounded-lg bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100 whitespace-pre-wrap break-words">
                                    {source?.content || source?.note || 'No runtime output available.'}
                                </pre>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
