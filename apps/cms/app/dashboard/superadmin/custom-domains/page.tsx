'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Loader2, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../../../../contexts/auth-context';
import { api } from '../../../../lib/api-client';

type DomainRequestStatus = 'pending' | 'connected';
type StatusFilter = DomainRequestStatus | 'all';

interface DomainRequestRow {
    id: string;
    name: string;
    subdomain: string;
    fullDomain?: string | null;
    customDomain: string;
    customDomainHostnameStatus?: string | null;
    customDomainSslStatus?: string | null;
    customDomainLastCheckedAt?: string | null;
    customDomainActivatedAt?: string | null;
    status: DomainRequestStatus;
    createdAt: string;
    updatedAt: string;
    tenant: {
        id: string;
        businessName: string;
        plan: 'free' | 'starter' | 'freelance' | 'enterprise';
        status: string;
    };
}

interface DomainRequestPayload {
    rows: DomainRequestRow[];
    totals: {
        all: number;
        pending: number;
        connected: number;
    };
}

export default function SuperAdminCustomDomainsPage() {
    const { user } = useAuth();
    const isSuperAdmin = user?.isSuperAdmin === true;

    const [payload, setPayload] = useState<DomainRequestPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [filter, setFilter] = useState<StatusFilter>('pending');
    const [search, setSearch] = useState('');
    const [copiedDomain, setCopiedDomain] = useState('');
    const [savingInstanceId, setSavingInstanceId] = useState('');

    useEffect(() => {
        if (!isSuperAdmin) {
            setIsLoading(false);
            return;
        }

        void loadRequests(filter, true);
    }, [isSuperAdmin, filter]);

    async function loadRequests(nextFilter: StatusFilter, isInitialLoad = false) {
        if (isInitialLoad) {
            setIsLoading(true);
        } else {
            setIsRefreshing(true);
        }
        setError('');

        const query = nextFilter === 'all' ? '' : `?status=${nextFilter}`;
        const response = await api.get<DomainRequestPayload>(`/cms/superadmin/custom-domains${query}`);

        if (!response.success || !response.data) {
            setError(response.error?.message || 'Failed to load custom domain requests.');
            setIsLoading(false);
            setIsRefreshing(false);
            return;
        }

        setPayload(response.data);
        setIsLoading(false);
        setIsRefreshing(false);
    }

    const filteredRows = useMemo(() => {
        const rows = payload?.rows || [];
        const normalizedSearch = search.trim().toLowerCase();
        if (!normalizedSearch) {
            return rows;
        }

        return rows.filter((row) => {
            const haystack = [
                row.customDomain,
                row.name,
                row.subdomain,
                row.fullDomain || '',
                row.tenant.businessName,
                row.tenant.plan,
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(normalizedSearch);
        });
    }, [payload, search]);

    async function copyDomain(domain: string) {
        try {
            await navigator.clipboard.writeText(domain);
            setCopiedDomain(domain);
            setTimeout(() => {
                setCopiedDomain((current) => (current === domain ? '' : current));
            }, 1500);
        } catch {
            setActionMessage('Copy failed. Please copy manually.');
        }
    }

    async function markConnected(instanceId: string) {
        setSavingInstanceId(instanceId);
        setActionMessage('');

        const response = await api.post(`/cms/superadmin/custom-domains/${encodeURIComponent(instanceId)}/mark-connected`);
        setSavingInstanceId('');

        if (!response.success) {
            setActionMessage(response.error?.message || 'Failed to update domain status.');
            return;
        }

        setActionMessage('Domain status updated to connected.');
        await loadRequests(filter);
    }

    if (!isSuperAdmin) {
        return (
            <div className="be-card p-6">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Custom Domain Requests</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Super admin access is required for this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Custom Domain Requests</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Review newly registered custom domains, copy hostnames, and mark them connected after Cloudflare setup.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void loadRequests(filter)}
                    disabled={isLoading || isRefreshing}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            )}
            {actionMessage && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {actionMessage}
                </div>
            )}

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Pending" value={String(payload?.totals.pending || 0)} />
                <StatCard label="Connected" value={String(payload?.totals.connected || 0)} />
                <StatCard label="All Custom Domains" value={String(payload?.totals.all || 0)} />
            </section>

            <section className="be-card p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <label className="text-sm">
                            <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">Search</span>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search by domain, website, or tenant"
                                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:border-slate-700 dark:bg-slate-900"
                                />
                            </div>
                        </label>
                    </div>
                    <div>
                        <label className="text-sm">
                            <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">Status</span>
                            <select
                                value={filter}
                                onChange={(event) => setFilter(event.target.value as StatusFilter)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:border-slate-700 dark:bg-slate-900"
                            >
                                <option value="pending">Pending</option>
                                <option value="connected">Connected</option>
                                <option value="all">All</option>
                            </select>
                        </label>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {isLoading ? (
                    <p className="px-5 py-6 text-sm text-slate-500">Loading custom domain requests...</p>
                ) : filteredRows.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-slate-500">No custom domain requests found for the selected filters.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[1120px] w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/40">
                                <tr>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Custom Domain</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Website</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tenant</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last Update</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((row) => (
                                    <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                                        <td className="px-5 py-3 align-top">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.customDomain}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Target: {row.fullDomain || `${row.subdomain}.buildmyonlineweb.site`}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3 align-top">
                                            <p className="text-sm text-slate-900 dark:text-slate-100">{row.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{row.subdomain}</p>
                                        </td>
                                        <td className="px-5 py-3 align-top">
                                            <p className="text-sm text-slate-900 dark:text-slate-100">{row.tenant.businessName}</p>
                                            <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{row.tenant.plan}</p>
                                        </td>
                                        <td className="px-5 py-3 align-top">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    row.status === 'connected'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                }`}
                                            >
                                                {row.status === 'connected' ? 'Connected' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 align-top text-sm text-slate-600 dark:text-slate-300">
                                            {new Date(row.updatedAt).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-3 align-top">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => void copyDomain(row.customDomain)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    {copiedDomain === row.customDomain ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                                    {copiedDomain === row.customDomain ? 'Copied' : 'Copy'}
                                                </button>
                                                {row.status === 'pending' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void markConnected(row.id)}
                                                        disabled={savingInstanceId === row.id}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {savingInstanceId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                                        Done
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="be-card p-4">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}
