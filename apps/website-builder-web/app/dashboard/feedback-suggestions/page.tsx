'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { api } from '../../../lib/api-client';

interface FeedbackEntry {
    id: string;
    type: 'suggestion';
    title: string | null;
    message: string | null;
    submittedByName: string;
    submittedByEmail: string;
    createdAt: string;
}

interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

const PAGE_SIZE = 10;

export default function FeedbackSuggestionsPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [entries, setEntries] = useState<FeedbackEntry[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        void loadEntries(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadEntries(targetPage: number) {
        setIsLoading(true);
        setError('');

        const res = await api.get<FeedbackEntry[]>(`/cms/feedback/suggestions?page=${targetPage}&limit=${PAGE_SIZE}`);
        if (res.success && res.data) {
            setEntries(res.data);
            setMeta(res.meta || null);
            setPage(targetPage);
        } else {
            setError(res.error?.message || 'Failed to load feedback suggestions.');
        }

        setIsLoading(false);
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');

        const payload = {
            title: title.trim(),
            message: message.trim(),
        };

        const res = await api.post<FeedbackEntry>('/cms/feedback/suggestions', payload);
        if (res.success) {
            setTitle('');
            setMessage('');
            setSuccessMessage('Thank you. Your suggestion has been submitted.');
            await loadEntries(1);
        } else {
            setError(res.error?.message || 'Failed to submit improvement suggestion.');
        }

        setIsSubmitting(false);
    }

    const canGoPrev = useMemo(() => page > 1, [page]);
    const canGoNext = useMemo(() => (meta ? page < meta.pages : false), [meta, page]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Improvement Suggestions</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Share ideas on how we can improve this product for your team.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="be-card space-y-4 p-5">
                <div>
                    <label htmlFor="suggestion-title" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Suggestion title
                    </label>
                    <input
                        id="suggestion-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        maxLength={255}
                        placeholder="Example: Better booking filters"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 dark:border-slate-700 dark:bg-slate-900"
                    />
                </div>

                <div>
                    <label htmlFor="suggestion-message" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Suggestion details
                    </label>
                    <textarea
                        id="suggestion-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={5}
                        maxLength={5000}
                        placeholder="Describe the change and why it would help your workflow."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 dark:border-slate-700 dark:bg-slate-900"
                    />
                </div>

                {successMessage && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/25 transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
                    </button>
                </div>
            </form>

            <section className="be-card overflow-hidden">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Suggestions</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Newest entries first</p>
                </div>

                {isLoading ? (
                    <div className="px-5 py-10 text-sm text-slate-500">Loading suggestions...</div>
                ) : entries.length === 0 ? (
                    <div className="px-5 py-10 text-sm text-slate-500">No suggestions submitted yet.</div>
                ) : (
                    <div className="space-y-0">
                        {entries.map((entry) => (
                            <article key={entry.id} className="border-b border-slate-100 px-5 py-4 last:border-b-0 dark:border-slate-800">
                                <div className="mb-2 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {entry.title || 'Untitled suggestion'}
                                        </h3>
                                        <p className="text-xs text-slate-500">{entry.submittedByName} ({entry.submittedByEmail})</p>
                                    </div>
                                    <span className="shrink-0 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{entry.message || '-'}</p>
                            </article>
                        ))}
                    </div>
                )}

                {meta && meta.pages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-slate-700">
                        <p className="text-xs text-slate-500">Page {meta.page} of {meta.pages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => void loadEntries(page - 1)}
                                disabled={!canGoPrev || isLoading}
                                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => void loadEntries(page + 1)}
                                disabled={!canGoNext || isLoading}
                                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                <MessageSquare className="mr-1 inline-block h-3.5 w-3.5" />
                Suggestions are immutable after submission.
            </div>
        </div>
    );
}
