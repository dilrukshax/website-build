'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api-client';
import { useAuth } from '../../../../contexts/auth-context';

interface ClaimRow {
    id: string;
    referrerId: string;
    refereeId: string;
    referralCode: string;
    riskScore: number;
    actionTaken: string;
    status: 'pending' | 'verify' | 'review' | 'blocked' | 'rewarded';
    flags: string[];
    createdAt: string;
    reviewedAt?: string | null;
    rewardedAt?: string | null;
    hasPendingEnterpriseReward: boolean;
}

export default function SuperAdminReferralsPage() {
    const { user } = useAuth();
    const isSuperAdmin = user?.isSuperAdmin === true;
    const [claims, setClaims] = useState<ClaimRow[]>([]);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'verify' | 'review' | 'blocked' | 'rewarded'>('review');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [enterpriseTierByClaim, setEnterpriseTierByClaim] = useState<Record<string, 'small' | 'medium' | 'large'>>({});

    useEffect(() => {
        if (!isSuperAdmin) {
            setIsLoading(false);
            return;
        }
        void loadClaims(statusFilter);
    }, [statusFilter, isSuperAdmin]);

    async function loadClaims(status: ClaimRow['status']) {
        setIsLoading(true);
        setError('');
        const response = await api.get<ClaimRow[]>(`/cms/superadmin/referrals/claims?status=${status}`);
        if (!response.success || !response.data) {
            setError(response.error?.message || 'Failed to load referral claims');
            setIsLoading(false);
            return;
        }
        setClaims(response.data);
        setIsLoading(false);
    }

    async function approveClaim(claimId: string): Promise<void> {
        setBusyId(claimId);
        const response = await api.post(`/cms/superadmin/referrals/claims/${claimId}/approve`, {});
        if (!response.success) {
            setError(response.error?.message || 'Failed to approve claim');
            setBusyId(null);
            return;
        }
        setBusyId(null);
        await loadClaims(statusFilter);
    }

    async function blockClaim(claimId: string): Promise<void> {
        const reason = window.prompt('Blocking reason (optional)') || undefined;
        setBusyId(claimId);
        const response = await api.post(`/cms/superadmin/referrals/claims/${claimId}/block`, { reason });
        if (!response.success) {
            setError(response.error?.message || 'Failed to block claim');
            setBusyId(null);
            return;
        }
        setBusyId(null);
        await loadClaims(statusFilter);
    }

    async function approveEnterprise(claimId: string): Promise<void> {
        const tier = enterpriseTierByClaim[claimId] || 'small';
        setBusyId(claimId);
        const response = await api.post(`/cms/superadmin/referrals/enterprise/${claimId}/approve`, { tier });
        if (!response.success) {
            setError(response.error?.message || 'Failed to approve enterprise reward');
            setBusyId(null);
            return;
        }
        setBusyId(null);
        await loadClaims(statusFilter);
    }

    async function rejectEnterprise(claimId: string): Promise<void> {
        const reason = window.prompt('Rejection reason (optional)') || undefined;
        setBusyId(claimId);
        const response = await api.post(`/cms/superadmin/referrals/enterprise/${claimId}/reject`, { reason });
        if (!response.success) {
            setError(response.error?.message || 'Failed to reject enterprise reward');
            setBusyId(null);
            return;
        }
        setBusyId(null);
        await loadClaims(statusFilter);
    }

    if (!isSuperAdmin) {
        return (
            <div className="be-card p-6">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Referral Review</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Super admin access is required for this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Referral Review</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Review suspicious claims and approve enterprise reward tiers.
                    </p>
                </div>
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as ClaimRow['status'])}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 dark:border-slate-700 dark:bg-slate-900"
                >
                    <option value="pending">Pending</option>
                    <option value="verify">Verify</option>
                    <option value="review">Review</option>
                    <option value="blocked">Blocked</option>
                    <option value="rewarded">Rewarded</option>
                </select>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {isLoading ? (
                    <p className="px-5 py-6 text-sm text-slate-500">Loading claims...</p>
                ) : claims.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-slate-500">No claims for this status.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[1200px] w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/40">
                                <tr>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Code</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Referrer</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Referee</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                    <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Flags</th>
                                    <th className="px-5 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {claims.map((claim) => (
                                    <tr key={claim.id} className="border-t border-slate-100 dark:border-slate-800">
                                        <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">{claim.referralCode}</td>
                                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">{claim.referrerId}</td>
                                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">{claim.refereeId}</td>
                                        <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">{claim.riskScore}</td>
                                        <td className="px-5 py-3 text-sm capitalize text-slate-700 dark:text-slate-200">{claim.status}</td>
                                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                                            {claim.flags.length ? claim.flags.join(', ') : '-'}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                {(claim.status === 'verify' || claim.status === 'review' || claim.status === 'pending') && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => approveClaim(claim.id)}
                                                            disabled={busyId === claim.id}
                                                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => blockClaim(claim.id)}
                                                            disabled={busyId === claim.id}
                                                            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                                        >
                                                            Block
                                                        </button>
                                                    </>
                                                )}

                                                {claim.hasPendingEnterpriseReward && (
                                                    <>
                                                        <select
                                                            value={enterpriseTierByClaim[claim.id] || 'small'}
                                                            onChange={(event) =>
                                                                setEnterpriseTierByClaim((prev) => ({
                                                                    ...prev,
                                                                    [claim.id]: event.target.value as 'small' | 'medium' | 'large',
                                                                }))
                                                            }
                                                            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                                                        >
                                                            <option value="small">Small</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="large">Large</option>
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => approveEnterprise(claim.id)}
                                                            disabled={busyId === claim.id}
                                                            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                                        >
                                                            Approve Tier
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => rejectEnterprise(claim.id)}
                                                            disabled={busyId === claim.id}
                                                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                                        >
                                                            Reject Tier
                                                        </button>
                                                    </>
                                                )}
                                            </div>
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
