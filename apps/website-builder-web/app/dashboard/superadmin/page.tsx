'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Activity, CreditCard, Search, ShieldCheck, Users, Globe2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../contexts/auth-context';
import { api } from '../../../lib/api-client';
import { getInstanceDisplayDomain } from '../../../lib/domain';

interface SuperAdminDashboardData {
    totals: {
        tenantsTotal: number;
        activeTenants: number;
        instancesTotal: number;
        activeInstances: number;
        activeStaffAssignments: number;
        pendingCharges: number;
        pendingReferralClaims: number;
        pendingCustomDomains?: number;
        activeSuperAdmins: number;
    };
    instances: Array<{
        id: string;
        name: string;
        subdomain: string;
        fullDomain?: string | null;
        customDomain?: string | null;
        timezone: string;
        status: 'active' | 'inactive';
        createdAt: string;
        tenant: {
            id: string;
            businessName: string;
            plan: 'free' | 'starter' | 'freelance' | 'enterprise';
            status: string;
        };
        usage: {
            customers: number;
            pages: number;
            servicesTotal: number;
            servicesActive: number;
            bookingsTotal: number;
            bookingsLast30Days: number;
            inquiriesTotal: number;
            inquiriesNew: number;
        };
    }>;
    generatedAt: string;
}

export default function SuperAdminDashboardPage() {
    const { user } = useAuth();
    const isSuperAdmin = user?.isSuperAdmin === true;
    const [dashboard, setDashboard] = useState<SuperAdminDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    useEffect(() => {
        if (!isSuperAdmin) {
            setIsLoading(false);
            return;
        }
        void loadDashboard();
    }, [isSuperAdmin]);

    async function loadDashboard() {
        setIsLoading(true);
        setError('');

        const response = await api.get<SuperAdminDashboardData>('/cms/superadmin/dashboard');
        if (!response.success || !response.data) {
            setError(response.error?.message || 'Failed to load super admin dashboard');
            setIsLoading(false);
            return;
        }

        setDashboard(response.data);
        setIsLoading(false);
    }

    const filteredInstances = useMemo(() => {
        if (!dashboard) return [];

        const normalizedSearch = search.trim().toLowerCase();

        return dashboard.instances.filter((instance) => {
            if (statusFilter !== 'all' && instance.status !== statusFilter) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            const domain = instance.customDomain || getInstanceDisplayDomain(instance);
            const haystack = [
                instance.name,
                instance.subdomain,
                domain,
                instance.tenant.businessName,
                instance.tenant.plan,
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(normalizedSearch);
        });
    }, [dashboard, search, statusFilter]);

    if (!isSuperAdmin) {
        return (
            <div className="be-card p-6">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Super Admin Dashboard</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Super admin access is required for this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Super Admin Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Platform-level overview and instance usage summary.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Link
                        href="/dashboard/superadmin/custom-domains"
                        className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
                    >
                        Open Custom Domains
                    </Link>
                    {dashboard?.generatedAt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Updated {new Date(dashboard.generatedAt).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            )}

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Active Tenants"
                    value={`${dashboard?.totals.activeTenants || 0} / ${dashboard?.totals.tenantsTotal || 0}`}
                    icon={<Users className="h-5 w-5" />}
                />
                <SummaryCard
                    label="Active Instances"
                    value={`${dashboard?.totals.activeInstances || 0} / ${dashboard?.totals.instancesTotal || 0}`}
                    icon={<Globe2 className="h-5 w-5" />}
                />
                <SummaryCard
                    label="Pending Charges"
                    value={String(dashboard?.totals.pendingCharges || 0)}
                    icon={<CreditCard className="h-5 w-5" />}
                />
                <SummaryCard
                    label="Pending Claims"
                    value={String(dashboard?.totals.pendingReferralClaims || 0)}
                    icon={<Activity className="h-5 w-5" />}
                />
                <SummaryCard
                    label="Pending Domains"
                    value={String(dashboard?.totals.pendingCustomDomains || 0)}
                    icon={<Globe2 className="h-5 w-5" />}
                />
                <SummaryCard
                    label="Active Staff Assignments"
                    value={String(dashboard?.totals.activeStaffAssignments || 0)}
                    icon={<Users className="h-5 w-5" />}
                />
                <SummaryCard
                    label="Super Admin Accounts"
                    value={String(dashboard?.totals.activeSuperAdmins || 0)}
                    icon={<ShieldCheck className="h-5 w-5" />}
                />
            </section>

            <section className="be-card p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <label className="text-sm md:col-span-2">
                        <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">Search instances</span>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by instance, domain, tenant, or plan"
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 dark:border-slate-700 dark:bg-slate-900"
                            />
                        </div>
                    </label>
                    <label className="text-sm">
                        <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">Status</span>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 dark:border-slate-700 dark:bg-slate-900"
                        >
                            <option value="all">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </label>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {isLoading ? (
                    <p className="px-5 py-6 text-sm text-slate-500">Loading dashboard...</p>
                ) : filteredInstances.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-slate-500">No instances found for the selected filters.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[1280px] w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/40">
                                <tr>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Instance</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tenant</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Customers</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Pages</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Services</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Bookings</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Inquiries</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInstances.map((instance) => {
                                    const domain = instance.customDomain || getInstanceDisplayDomain(instance);

                                    return (
                                        <tr key={instance.id} className="border-t border-slate-100 dark:border-slate-800">
                                            <td className="px-5 py-3">
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{instance.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{domain}</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">TZ: {instance.timezone}</p>
                                            </td>
                                            <td className="px-5 py-3">
                                                <p className="text-sm text-slate-900 dark:text-slate-100">{instance.tenant.businessName}</p>
                                                <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{instance.tenant.plan}</p>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">{instance.usage.customers}</td>
                                            <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">{instance.usage.pages}</td>
                                            <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">
                                                {instance.usage.servicesActive} active / {instance.usage.servicesTotal} total
                                            </td>
                                            <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">
                                                {instance.usage.bookingsLast30Days} (30d) / {instance.usage.bookingsTotal} total
                                            </td>
                                            <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">
                                                {instance.usage.inquiriesNew} new / {instance.usage.inquiriesTotal} total
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        instance.status === 'active'
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                                >
                                                    {instance.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
    return (
        <div className="be-card p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                <div className="text-[#2563eb]">{icon}</div>
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}
