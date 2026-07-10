'use client';

import Link from 'next/link';
import { Building2, Globe2, Palette, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../../contexts/auth-context';
import { getInstanceDisplayDomain } from '../../../lib/domain';

export default function SettingsPage() {
    const { currentTenant, currentInstance } = useAuth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Settings</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Review organization and website configuration details.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <section className="be-card p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-[#2563eb]" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Organization</h2>
                    </div>
                    <dl className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                            <dd className="font-medium text-slate-900 dark:text-slate-100">
                                {currentTenant?.businessName || 'Not selected'}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-500 dark:text-slate-400">Role</dt>
                            <dd className="font-medium text-slate-900 dark:text-slate-100">
                                {currentTenant?.role || 'N/A'}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-500 dark:text-slate-400">Access Level</dt>
                            <dd className="font-medium text-slate-900 dark:text-slate-100">
                                {currentTenant?.isOwner ? 'Owner' : 'Staff'}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-500 dark:text-slate-400">Plan</dt>
                            <dd className="font-medium capitalize text-slate-900 dark:text-slate-100">
                                {currentTenant?.plan || 'free'}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-500 dark:text-slate-400">Billing Interval</dt>
                            <dd className="font-medium capitalize text-slate-900 dark:text-slate-100">
                                {currentTenant?.billingInterval || 'monthly'}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-500 dark:text-slate-400">Instance Usage</dt>
                            <dd className="font-medium text-slate-900 dark:text-slate-100">
                                {currentTenant
                                    ? `${currentTenant.usageSummary.instances.used}${currentTenant.usageSummary.instances.limit === null ? ' / Unlimited' : ` / ${currentTenant.usageSummary.instances.limit}`}`
                                    : '-'}
                            </dd>
                        </div>
                    </dl>
                </section>

                <section className="be-card p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <Globe2 className="h-5 w-5 text-[#2563eb]" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Website</h2>
                    </div>
                    <dl className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-500 dark:text-slate-400">Website Name</dt>
                            <dd className="font-medium text-slate-900 dark:text-slate-100">
                                {currentInstance?.name || 'Not selected'}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-500 dark:text-slate-400">Domain</dt>
                            <dd className="max-w-[260px] truncate font-medium text-slate-900 dark:text-slate-100">
                                {getInstanceDisplayDomain(currentInstance)}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-500 dark:text-slate-400">Status</dt>
                            <dd className="font-medium text-slate-900 dark:text-slate-100">
                                {currentInstance?.status || 'N/A'}
                            </dd>
                        </div>
                    </dl>
                </section>
            </div>

            <section className="be-card p-6">
                <div className="mb-5 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-[#2563eb]" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Website Customization</h2>
                </div>
                <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                    Manage published-site HTML snippets from the dedicated website settings page.
                </p>
                <Link
                    href="/dashboard/website-settings"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/25 transition hover:bg-[#1d4ed8]"
                >
                    Open Website Settings
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
            </section>

            <section className="be-card p-6">
                <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#2563eb]" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security Notice</h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Permission and role management is available under the Roles and Staff sections. All updates remain
                    tenant-scoped and enforced by your current access rights.
                </p>
            </section>
        </div>
    );
}
