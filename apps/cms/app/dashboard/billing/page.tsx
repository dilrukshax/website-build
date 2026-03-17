'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../contexts/auth-context';

type PlanTier = 'free' | 'starter' | 'freelance' | 'enterprise';
type BillingInterval = 'monthly' | 'annual';

interface BillingCharge {
    id: string;
    chargeType: 'plan_change' | 'addon_bundle';
    status: 'pending' | 'confirmed' | 'rejected';
    requestedPlan?: PlanTier | null;
    requestedInterval?: BillingInterval | null;
    requestedAddonBundles?: number | null;
    amountCents: number;
    creditAppliedCents: number;
    netAmountCents: number;
    createdAt: string;
    reviewedAt?: string | null;
    rejectionReason?: string | null;
}

interface BillingSummary {
    subscription: {
        plan: PlanTier;
        billingInterval: BillingInterval;
        addonBundles: number;
        status: string;
    } | null;
    limits: {
        maxInstances: number | null;
        maxCustomDomains: number | null;
        allowStaffAccounts: boolean;
        allowAddonBundle: boolean;
        addonBundles: number;
        maxPagesPerInstance: number | null;
        maxBookingsPerDay: number | null;
        maxActiveServices: number | null;
        maxAccessibleThemes: number | null;
        allowPremiumTemplates: boolean;
    };
    usage: {
        instances: number;
        customDomains: number;
        staffAccounts: number;
    };
    wallet: {
        balanceCents: number;
    };
    pendingCharges: BillingCharge[];
    recentCharges: BillingCharge[];
}

const PLAN_OPTIONS: Array<{ plan: PlanTier; label: string }> = [
    { plan: 'free', label: 'Free' },
    { plan: 'starter', label: 'Starter' },
    { plan: 'freelance', label: 'Freelance' },
    { plan: 'enterprise', label: 'Enterprise' },
];

export default function BillingPage() {
    const { currentTenant } = useAuth();
    const [summary, setSummary] = useState<BillingSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [planForm, setPlanForm] = useState<{ requestedPlan: PlanTier; requestedInterval: BillingInterval; notes: string }>({
        requestedPlan: currentTenant?.plan || 'starter',
        requestedInterval: currentTenant?.billingInterval || 'monthly',
        notes: '',
    });
    const [addonBundles, setAddonBundles] = useState('1');
    const [redeemPoints, setRedeemPoints] = useState('600');
    const [submitting, setSubmitting] = useState<'plan' | 'addon' | 'redeem' | null>(null);

    useEffect(() => {
        void loadSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTenant?.id]);

    useEffect(() => {
        if (!currentTenant) return;
        setPlanForm((prev) => ({
            ...prev,
            requestedPlan: currentTenant.plan,
            requestedInterval: currentTenant.billingInterval,
        }));
    }, [currentTenant]);

    const canManageBilling = currentTenant?.isOwner === true;
    const subscription = summary?.subscription;
    const addonAllowed = summary?.limits.allowAddonBundle === true;

    const usageRows = useMemo(() => {
        if (!summary) return [];
        return [
            {
                label: 'Instances',
                used: summary.usage.instances,
                limit: summary.limits.maxInstances,
            },
            {
                label: 'Custom Domains',
                used: summary.usage.customDomains,
                limit: summary.limits.maxCustomDomains,
            },
            {
                label: 'Staff Accounts',
                used: summary.usage.staffAccounts,
                limit: summary.limits.allowStaffAccounts ? null : 0,
            },
        ];
    }, [summary]);

    async function loadSummary(): Promise<void> {
        setIsLoading(true);
        setError('');
        const response = await api.get<BillingSummary>('/cms/billing/summary');
        if (!response.success || !response.data) {
            setError(response.error?.message || 'Failed to load billing summary');
            setIsLoading(false);
            return;
        }

        setSummary(response.data);
        setIsLoading(false);
    }

    async function submitPlanChange(): Promise<void> {
        setSubmitting('plan');
        setActionMessage('');
        const response = await api.post('/cms/billing/plan-change', planForm);
        if (!response.success) {
            setActionMessage(response.error?.message || 'Plan change request failed');
            setSubmitting(null);
            return;
        }

        setActionMessage('Plan change request submitted for superadmin confirmation.');
        setSubmitting(null);
        await loadSummary();
    }

    async function submitAddons(): Promise<void> {
        const bundles = Number(addonBundles);
        if (!Number.isInteger(bundles) || bundles < 1) {
            setActionMessage('Add-on bundle count must be at least 1');
            return;
        }

        setSubmitting('addon');
        setActionMessage('');
        const response = await api.post('/cms/billing/addons', { bundles });
        if (!response.success) {
            setActionMessage(response.error?.message || 'Add-on request failed');
            setSubmitting(null);
            return;
        }

        setActionMessage('Add-on bundle request submitted for superadmin confirmation.');
        setSubmitting(null);
        await loadSummary();
    }

    async function submitRedeem(): Promise<void> {
        if (!currentTenant) {
            return;
        }

        const points = Number(redeemPoints);
        if (!Number.isInteger(points) || points < 600) {
            setActionMessage('Minimum redemption is 600 points');
            return;
        }

        setSubmitting('redeem');
        setActionMessage('');

        const response = await api.post('/cms/billing/redeem-points', {
            tenantId: currentTenant.id,
            points,
        });

        if (!response.success) {
            setActionMessage(response.error?.message || 'Points redemption failed');
            setSubmitting(null);
            return;
        }

        setActionMessage(`Redeemed ${points} points into tenant billing credit.`);
        setSubmitting(null);
        await loadSummary();
    }

    if (isLoading) {
        return <div className="text-sm text-slate-500">Loading billing summary...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Billing</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Plan, usage, pending charges, and wallet credits.
                </p>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            )}

            {actionMessage && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {actionMessage}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Current Plan" value={subscription?.plan || currentTenant?.plan || 'free'} />
                <MetricCard label="Billing Interval" value={subscription?.billingInterval || currentTenant?.billingInterval || 'monthly'} />
                <MetricCard label="Add-on Bundles" value={String(subscription?.addonBundles ?? currentTenant?.addonBundles ?? 0)} />
                <MetricCard label="Wallet Credit" value={`$${((summary?.wallet.balanceCents || 0) / 100).toFixed(2)}`} />
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Usage</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {usageRows.map((row) => {
                        const ratio = row.limit && row.limit > 0 ? Math.min(100, Math.round((row.used / row.limit) * 100)) : 0;
                        return (
                            <div key={row.label} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{row.label}</p>
                                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                                    {row.used}
                                    {row.limit === null ? ' / Unlimited' : ` / ${row.limit}`}
                                </p>
                                {row.limit !== null && row.limit > 0 && (
                                    <div className="mt-2 h-2 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
                                        <div className="h-full rounded bg-[#5048e5]" style={{ width: `${ratio}%` }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">Request Plan Change</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Submitted requests require superadmin charge confirmation.
                    </p>

                    {!canManageBilling ? (
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Only owner accounts can request plan changes.</p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            <div className="grid gap-3 md:grid-cols-2">
                                <select
                                    value={planForm.requestedPlan}
                                    onChange={(event) => setPlanForm((prev) => ({ ...prev, requestedPlan: event.target.value as PlanTier }))}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:border-slate-700 dark:bg-slate-950"
                                >
                                    {PLAN_OPTIONS.map((option) => (
                                        <option key={option.plan} value={option.plan}>{option.label}</option>
                                    ))}
                                </select>
                                <select
                                    value={planForm.requestedInterval}
                                    onChange={(event) => setPlanForm((prev) => ({ ...prev, requestedInterval: event.target.value as BillingInterval }))}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:border-slate-700 dark:bg-slate-950"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="annual">Annual</option>
                                </select>
                            </div>
                            <textarea
                                value={planForm.notes}
                                onChange={(event) => setPlanForm((prev) => ({ ...prev, notes: event.target.value }))}
                                rows={3}
                                placeholder="Optional notes for superadmin"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:border-slate-700 dark:bg-slate-950"
                            />
                            <button
                                type="button"
                                onClick={submitPlanChange}
                                disabled={submitting === 'plan'}
                                className="rounded-lg bg-[#5048e5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#433bcf] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting === 'plan' ? 'Submitting...' : 'Submit Plan Change'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Request Add-on Bundles</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Each bundle increases instance and custom-domain limits by 1.
                        </p>
                        {!canManageBilling ? (
                            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Only owner accounts can request add-ons.</p>
                        ) : !addonAllowed ? (
                            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Add-on bundles are unavailable on this plan.</p>
                        ) : (
                            <div className="mt-4 flex items-center gap-3">
                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={addonBundles}
                                    onChange={(event) => setAddonBundles(event.target.value)}
                                    className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:border-slate-700 dark:bg-slate-950"
                                />
                                <button
                                    type="button"
                                    onClick={submitAddons}
                                    disabled={submitting === 'addon'}
                                    className="rounded-lg bg-[#5048e5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#433bcf] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting === 'addon' ? 'Submitting...' : 'Request Add-ons'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Redeem Referral Points</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Minimum redemption: 600 points.</p>
                        {!canManageBilling ? (
                            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Only owner accounts can redeem points.</p>
                        ) : (
                            <div className="mt-4 flex items-center gap-3">
                                <input
                                    type="number"
                                    min={600}
                                    step={1}
                                    value={redeemPoints}
                                    onChange={(event) => setRedeemPoints(event.target.value)}
                                    className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:border-slate-700 dark:bg-slate-950"
                                />
                                <button
                                    type="button"
                                    onClick={submitRedeem}
                                    disabled={submitting === 'redeem'}
                                    className="rounded-lg bg-[#5048e5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#433bcf] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting === 'redeem' ? 'Redeeming...' : 'Redeem'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Pending Charges</h2>
                </div>
                {(summary?.pendingCharges.length || 0) === 0 ? (
                    <p className="px-5 py-5 text-sm text-slate-500 dark:text-slate-400">No pending charges.</p>
                ) : (
                    <ChargeTable rows={summary?.pendingCharges || []} />
                )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Charges</h2>
                </div>
                {(summary?.recentCharges.length || 0) === 0 ? (
                    <p className="px-5 py-5 text-sm text-slate-500 dark:text-slate-400">No charge history yet.</p>
                ) : (
                    <ChargeTable rows={summary?.recentCharges || []} />
                )}
            </section>
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-bold capitalize text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}

function ChargeTable({ rows }: { rows: BillingCharge[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/40">
                    <tr>
                        <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                        <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Requested</th>
                        <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                        <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                        <th className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((charge) => (
                        <tr key={charge.id} className="border-t border-slate-100 dark:border-slate-800">
                            <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">{charge.chargeType}</td>
                            <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">
                                {charge.chargeType === 'plan_change'
                                    ? `${charge.requestedPlan || 'n/a'} (${charge.requestedInterval || 'n/a'})`
                                    : `Bundles: ${charge.requestedAddonBundles || 0}`}
                            </td>
                            <td className="px-5 py-3 text-sm capitalize text-slate-700 dark:text-slate-200">{charge.status}</td>
                            <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">
                                ${((charge.netAmountCents ?? charge.amountCents) / 100).toFixed(2)}
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-500 dark:text-slate-400">
                                {new Date(charge.createdAt).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

