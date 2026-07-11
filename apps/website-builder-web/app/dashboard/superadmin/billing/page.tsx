'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api-client';
import { useAuth } from '../../../../contexts/auth-context';

interface ChargeRow {
    id: string;
    tenantId: string;
    chargeType: 'plan_change' | 'addon_bundle';
    status: 'pending' | 'confirmed' | 'rejected';
    requestedPlan?: string | null;
    requestedInterval?: string | null;
    requestedAddonBundles?: number | null;
    amountCents: number;
    netAmountCents: number;
    creditAppliedCents: number;
    createdAt: string;
    notes?: string | null;
    rejectionReason?: string | null;
    tenant: {
        businessName: string;
        ownerId: string;
    };
}

export default function SuperAdminBillingPage() {
    const { user } = useAuth();
    const isSuperAdmin = user?.isSuperAdmin === true;
    const [charges, setCharges] = useState<ChargeRow[]>([]);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'confirmed' | 'rejected'>('pending');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        if (!isSuperAdmin) {
            setIsLoading(false);
            return;
        }
        void loadCharges(statusFilter);
    }, [statusFilter, isSuperAdmin]);

    async function loadCharges(status: 'pending' | 'confirmed' | 'rejected') {
        setIsLoading(true);
        setError('');

        const response = await api.get<ChargeRow[]>(`/cms/superadmin/billing/charges?status=${status}`);
        if (!response.success || !response.data) {
            setError(response.error?.message || 'Failed to load billing charges');
            setIsLoading(false);
            return;
        }

        setCharges(response.data);
        setIsLoading(false);
    }

    async function confirmCharge(id: string): Promise<void> {
        setBusyId(id);
        const response = await api.post(`/cms/superadmin/billing/charges/${id}/confirm`);
        if (!response.success) {
            setError(response.error?.message || 'Failed to confirm charge');
            setBusyId(null);
            return;
        }
        setBusyId(null);
        await loadCharges(statusFilter);
    }

    async function rejectCharge(id: string): Promise<void> {
        const reason = window.prompt('Rejection reason (optional)') || undefined;
        setBusyId(id);
        const response = await api.post(`/cms/superadmin/billing/charges/${id}/reject`, { reason });
        if (!response.success) {
            setError(response.error?.message || 'Failed to reject charge');
            setBusyId(null);
            return;
        }
        setBusyId(null);
        await loadCharges(statusFilter);
    }

    if (!isSuperAdmin) {
        return (
            <div className="be-card p-6">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Billing Charge Review</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Super admin access is required for this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Billing Charge Review</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Confirm or reject pending tenant billing requests.
                    </p>
                </div>
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as 'pending' | 'confirmed' | 'rejected')}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 dark:border-slate-700 dark:bg-slate-900"
                >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {isLoading ? (
                    <p className="px-5 py-6 text-sm text-slate-500">Loading charges...</p>
                ) : charges.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-slate-500">No charges for this status.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[980px] w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/40">
                                <tr>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tenant</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Requested</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                                    <th className="px-5 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {charges.map((charge) => (
                                    <tr key={charge.id} className="border-t border-slate-100 dark:border-slate-800">
                                        <td className="px-5 py-3 text-sm font-medium text-slate-900 dark:text-white">{charge.tenant.businessName}</td>
                                        <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">{charge.chargeType}</td>
                                        <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">
                                            {charge.chargeType === 'plan_change'
                                                ? `${charge.requestedPlan || 'n/a'} (${charge.requestedInterval || 'n/a'})`
                                                : `Bundles: ${charge.requestedAddonBundles || 0}`}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">
                                            ${(charge.amountCents / 100).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-3 text-sm capitalize text-slate-700 dark:text-slate-200">{charge.status}</td>
                                        <td className="px-5 py-3 text-sm text-slate-500 dark:text-slate-400">{new Date(charge.createdAt).toLocaleString()}</td>
                                        <td className="px-5 py-3 text-right">
                                            {charge.status === 'pending' ? (
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => confirmCharge(charge.id)}
                                                        disabled={busyId === charge.id}
                                                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => rejectCharge(charge.id)}
                                                        disabled={busyId === charge.id}
                                                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
