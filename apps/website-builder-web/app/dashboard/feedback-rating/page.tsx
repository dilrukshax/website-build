'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { api } from '../../../lib/api-client';

interface FeedbackEntry {
    id: string;
    type: 'rating';
    score: number | null;
    note: string | null;
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

export default function FeedbackRatingPage() {
    const [score, setScore] = useState<number>(5);
    const [note, setNote] = useState('');
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

        const res = await api.get<FeedbackEntry[]>(`/cms/feedback/ratings?page=${targetPage}&limit=${PAGE_SIZE}`);
        if (res.success && res.data) {
            setEntries(res.data);
            setMeta(res.meta || null);
            setPage(targetPage);
        } else {
            setError(res.error?.message || 'Failed to load feedback ratings.');
        }

        setIsLoading(false);
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');

        const payload = {
            score,
            note: note.trim() || undefined,
        };

        const res = await api.post<FeedbackEntry>('/cms/feedback/ratings', payload);
        if (res.success) {
            setNote('');
            setSuccessMessage('Thank you. Your rating has been submitted.');
            await loadEntries(1);
        } else {
            setError(res.error?.message || 'Failed to submit feedback rating.');
        }

        setIsSubmitting(false);
    }

    const canGoPrev = useMemo(() => page > 1, [page]);
    const canGoNext = useMemo(() => (meta ? page < meta.pages : false), [meta, page]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Feedback</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Share how well the product is working for your tenant.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="be-card space-y-4 p-5">
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Rate your experience (1-5)</label>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setScore(value)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                                    score === value
                                        ? 'border-[#5048e5] bg-[#5048e5] text-white'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#5048e5]/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                                }`}
                            >
                                <Star className="h-4 w-4" />
                                {value}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="rating-note" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Optional note
                    </label>
                    <textarea
                        id="rating-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={4}
                        maxLength={2000}
                        placeholder="Tell us what works well or what can be better."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:border-slate-700 dark:bg-slate-900"
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
                        className="rounded-lg bg-[#5048e5] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#5048e5]/25 transition hover:bg-[#433bcf] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                    </button>
                </div>
            </form>

            <section className="be-card overflow-hidden">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Ratings</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Newest entries first</p>
                </div>

                {isLoading ? (
                    <div className="px-5 py-10 text-sm text-slate-500">Loading ratings...</div>
                ) : entries.length === 0 ? (
                    <div className="px-5 py-10 text-sm text-slate-500">No ratings submitted yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[860px] w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Score</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Note</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Submitted By</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-[#5048e5]/5">
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-[#5048e5]/10 px-2.5 py-1 text-xs font-semibold text-[#5048e5]">
                                                <Star className="h-3.5 w-3.5" />
                                                {entry.score ?? '-'} / 5
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{entry.note || 'No note provided'}</td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{entry.submittedByName}</p>
                                            <p className="text-xs text-slate-500">{entry.submittedByEmail}</p>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                                            {new Date(entry.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
        </div>
    );
}
