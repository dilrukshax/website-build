'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../contexts/auth-context';
import { api } from '../../../../lib/api-client';

interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

interface TenantOption {
    id: string;
    businessName: string;
}

interface SuperAdminFeedback {
    id: string;
    type: 'rating' | 'suggestion';
    score: number | null;
    note: string | null;
    title: string | null;
    message: string | null;
    submittedByName: string;
    submittedByEmail: string;
    createdAt: string;
    tenant: {
        id: string;
        businessName: string;
    };
}

const PAGE_SIZE = 20;

export default function SuperAdminFeedbackPage() {
    const { user } = useAuth();
    const isSuperAdmin = user?.isSuperAdmin === true;

    const [entries, setEntries] = useState<SuperAdminFeedback[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [tenants, setTenants] = useState<TenantOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState<'all' | 'rating' | 'suggestion'>('all');
    const [tenantFilter, setTenantFilter] = useState('all');

    useEffect(() => {
        if (!isSuperAdmin) {
            setIsLoading(false);
            return;
        }

        void loadTenants();
    }, [isSuperAdmin]);

    useEffect(() => {
        if (!isSuperAdmin) return;
        void loadFeedback(page, typeFilter, tenantFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuperAdmin, page, typeFilter, tenantFilter]);

    async function loadTenants() {
        const res = await api.get<TenantOption[]>('/cms/superadmin/tenants');
        if (res.success && res.data) {
            setTenants(res.data.map((tenant) => ({ id: tenant.id, businessName: tenant.businessName })));
        }
    }

    async function loadFeedback(targetPage: number, type: 'all' | 'rating' | 'suggestion', tenantId: string) {
        setIsLoading(true);
        setError('');

        const params = new URLSearchParams({
            page: String(targetPage),
            limit: String(PAGE_SIZE),
        });

        if (type !== 'all') {
            params.set('type', type);
        }

        if (tenantId !== 'all') {
            params.set('tenantId', tenantId);
        }

        const res = await api.get<SuperAdminFeedback[]>(`/cms/superadmin/feedback?${params.toString()}`);
        if (res.success && res.data) {
            setEntries(res.data);
            setMeta(res.meta || null);
        } else {
            setError(res.error?.message || 'Failed to load feedback.');
        }

        setIsLoading(false);
    }

    const canGoPrev = useMemo(() => page > 1, [page]);
    const canGoNext = useMemo(() => (meta ? page < meta.pages : false), [meta, page]);

    if (!isSuperAdmin) {
        return (
            <div className="be-card p-6">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">All Feedback</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Super admin access is required for this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">All Feedback</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Review tenant product ratings and improvement suggestions.</p>
            </div>

            <div className="be-card p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <label className="text-sm">
                        <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">Feedback Type</span>
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setPage(1);
                                setTypeFilter(e.target.value as 'all' | 'rating' | 'suggestion');
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:border-slate-700 dark:bg-slate-900"
                        >
                            <option value="all">All types</option>
                            <option value="rating">Ratings</option>
                            <option value="suggestion">Suggestions</option>
                        </select>
                    </label>

                    <label className="text-sm md:col-span-2">
                        <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">Tenant</span>
                        <select
                            value={tenantFilter}
                            onChange={(e) => {
                                setPage(1);
                                setTenantFilter(e.target.value);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:border-slate-700 dark:bg-slate-900"
                        >
                            <option value="all">All tenants</option>
                            {tenants.map((tenant) => (
                                <option key={tenant.id} value={tenant.id}>
                                    {tenant.businessName}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            )}

            <div className="be-card overflow-hidden">
                {isLoading ? (
                    <div className="px-5 py-10 text-sm text-slate-500">Loading feedback...</div>
                ) : entries.length === 0 ? (
                    <div className="px-5 py-10 text-sm text-slate-500">No feedback records found for the selected filters.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[1060px] w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Tenant</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Details</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Submitted By</th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-[#5048e5]/5">
                                        <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">{entry.tenant.businessName}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                entry.type === 'rating'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                            }`}>
                                                {entry.type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                                            {entry.type === 'rating' ? (
                                                <div className="space-y-1">
                                                    <p className="font-medium text-slate-900 dark:text-slate-100">Score: {entry.score ?? '-'}/5</p>
                                                    <p>{entry.note || 'No note provided'}</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <p className="font-medium text-slate-900 dark:text-slate-100">{entry.title || 'Untitled suggestion'}</p>
                                                    <p className="max-w-xl truncate">{entry.message || '-'}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{entry.submittedByName}</p>
                                            <p className="text-xs text-slate-500">{entry.submittedByEmail}</p>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{new Date(entry.createdAt).toLocaleString()}</td>
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
                                onClick={() => setPage((prev) => prev - 1)}
                                disabled={!canGoPrev || isLoading}
                                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((prev) => prev + 1)}
                                disabled={!canGoNext || isLoading}
                                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
