'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Gift, Link as LinkIcon, Wallet } from 'lucide-react';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../contexts/auth-context';

interface ReferralRewardEvent {
    id: string;
    milestone: string;
    status: string;
    awardedPoints: number;
    createdAt: string;
    grantedAt?: string | null;
}

interface ReferralRedemption {
    id: string;
    tenantId: string;
    requestedPoints: number;
    creditedCents: number;
    status: string;
    createdAt: string;
}

interface ReferralData {
    referralCode: string;
    referralLink: string;
    stats: {
        totalReferrals: number;
        pendingReferrals: number;
        blockedReferrals: number;
        rewardedReferrals: number;
    };
    points: {
        availablePoints: number;
        minimumRedemptionPoints: number;
        pointToCreditRatio: string;
    };
    rewards: ReferralRewardEvent[];
    redemptions: ReferralRedemption[];
}

export default function ReferralsPage() {
    const { currentTenant, tenants } = useAuth();
    const [data, setData] = useState<ReferralData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [redeemTenantId, setRedeemTenantId] = useState('');
    const [redeemPoints, setRedeemPoints] = useState('600');
    const [redeemSubmitting, setRedeemSubmitting] = useState(false);
    const [redeemMessage, setRedeemMessage] = useState('');

    const ownerTenants = useMemo(() => tenants.filter((tenant) => tenant.isOwner), [tenants]);
    const canRedeem = ownerTenants.length > 0;

    useEffect(() => {
        void loadReferralData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (redeemTenantId) {
            return;
        }
        if (currentTenant?.isOwner) {
            setRedeemTenantId(currentTenant.id);
            return;
        }
        if (ownerTenants[0]) {
            setRedeemTenantId(ownerTenants[0].id);
        }
    }, [currentTenant, ownerTenants, redeemTenantId]);

    async function loadReferralData(): Promise<void> {
        setIsLoading(true);
        setError('');

        const response = await api.get<ReferralData>('/cms/referrals/me');

        if (!response.success || !response.data) {
            setError(response.error?.message || 'Failed to load referral data');
            setIsLoading(false);
            return;
        }

        setData(response.data);
        setIsLoading(false);
    }

    async function copyReferralLink(): Promise<void> {
        if (!data?.referralLink) {
            return;
        }

        try {
            await navigator.clipboard.writeText(data.referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    }

    async function redeem(): Promise<void> {
        if (!redeemTenantId) {
            setRedeemMessage('Select a tenant for redemption');
            return;
        }

        const pointsValue = Number(redeemPoints);
        if (!Number.isInteger(pointsValue) || pointsValue < 600) {
            setRedeemMessage('Minimum redemption is 600 points');
            return;
        }

        setRedeemSubmitting(true);
        setRedeemMessage('');

        const response = await api.post<{ creditedCents: number }>('/cms/billing/redeem-points', {
            tenantId: redeemTenantId,
            points: pointsValue,
        });

        if (!response.success) {
            setRedeemMessage(response.error?.message || 'Redemption failed');
            setRedeemSubmitting(false);
            return;
        }

        setRedeemMessage(`Redeemed ${pointsValue} points successfully.`);
        setRedeemSubmitting(false);
        await loadReferralData();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Referrals</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Track referral progress, rewards, and points redemptions.
                </p>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-5">
                <StatCard label="Total Referrals" value={data?.stats.totalReferrals ?? 0} />
                <StatCard label="Pending" value={data?.stats.pendingReferrals ?? 0} />
                <StatCard label="Blocked" value={data?.stats.blockedReferrals ?? 0} />
                <StatCard label="Rewarded" value={data?.stats.rewardedReferrals ?? 0} />
                <StatCard label="Available Points" value={data?.points.availablePoints ?? 0} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your Referral Link</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {isLoading ? 'Loading referral details...' : `Code: ${data?.referralCode || 'N/A'}`}
                        </p>
                    </div>
                    <LinkIcon className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                        {isLoading ? 'Loading...' : (data?.referralLink || 'No referral link yet')}
                    </div>
                    <button
                        type="button"
                        onClick={copyReferralLink}
                        disabled={!data?.referralLink}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Copy className="h-4 w-4" />
                        {copied ? 'Copied' : 'Copy link'}
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-[#dc2626]" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Redeem Points</h2>
                </div>

                <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                    {data?.points.pointToCreditRatio || '1 point = $0.01 credit'}.
                </p>

                {!canRedeem ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        You need owner access to at least one tenant to redeem points.
                    </p>
                ) : (
                    <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                        <select
                            value={redeemTenantId}
                            onChange={(event) => setRedeemTenantId(event.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 dark:border-slate-700 dark:bg-slate-950"
                        >
                            {ownerTenants.map((tenant) => (
                                <option key={tenant.id} value={tenant.id}>{tenant.businessName}</option>
                            ))}
                        </select>

                        <input
                            type="number"
                            min={600}
                            step={1}
                            value={redeemPoints}
                            onChange={(event) => setRedeemPoints(event.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 dark:border-slate-700 dark:bg-slate-950"
                        />

                        <button
                            type="button"
                            onClick={redeem}
                            disabled={redeemSubmitting || isLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Gift className="h-4 w-4" />
                            {redeemSubmitting ? 'Redeeming...' : 'Redeem'}
                        </button>
                    </div>
                )}

                {redeemMessage && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{redeemMessage}</p>
                )}
            </div>

            <HistoryCard
                title="Reward History"
                emptyText="No rewards recorded yet."
                rows={data?.rewards || []}
                renderRow={(reward) => (
                    <tr key={reward.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{reward.milestone}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{reward.status}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">{reward.awardedPoints}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{new Date(reward.createdAt).toLocaleString()}</td>
                    </tr>
                )}
            />

            <HistoryCard
                title="Redemption History"
                emptyText="No redemptions yet."
                rows={data?.redemptions || []}
                renderRow={(redemption) => (
                    <tr key={redemption.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{redemption.status}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{redemption.requestedPoints}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">${(redemption.creditedCents / 100).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{new Date(redemption.createdAt).toLocaleString()}</td>
                    </tr>
                )}
            />
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}

function HistoryCard<T>({
    title,
    rows,
    emptyText,
    renderRow,
}: {
    title: string;
    rows: T[];
    emptyText: string;
    renderRow: (row: T) => React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
            </div>

            {rows.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                        <thead className="bg-slate-50 dark:bg-slate-900/40">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status / Points</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                            </tr>
                        </thead>
                        <tbody>{rows.map((row) => renderRow(row))}</tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

