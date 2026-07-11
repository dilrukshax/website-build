'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Activity,
    ArrowUpRight,
    BarChart3,
    Clock,
    Globe2,
    Loader2,
    MousePointerClick,
    Smartphone,
    Users,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useAuth } from '../../../contexts/auth-context';
import { api } from '../../../lib/api-client';

interface AnalyticsSummary {
    configured: boolean;
    reason?: 'missing_property_id' | 'missing_server_credentials' | 'fetch_error' | string | null;
    range?: { startDate: string; endDate: string };
    totals?: { sessions: number; users: number; avgSessionDuration: number };
    byDate?: Array<{ date: string; sessions: number; users: number }>;
    bySource?: Array<{ channel: string; sessions: number }>;
    topPages?: Array<{ path: string; views: number }>;
    byDevice?: Array<{ device: string; sessions: number }>;
}

type RangeOption = 7 | 30 | 90;

const RANGE_OPTIONS: RangeOption[] = [7, 30, 90];

const PIE_COLORS = ['#dc2626', '#b91c1c', '#f87171', '#fca5a5', '#7f1d1d', '#fee2e2'];

function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}

function rangeDates(days: RangeOption): { startDate: string; endDate: string } {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { startDate: fmt(start), endDate: fmt(end) };
}

export default function AnalyticsPage() {
    const { currentInstance } = useAuth();
    const [range, setRange] = useState<RangeOption>(30);
    const [data, setData] = useState<AnalyticsSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadAnalytics = useCallback(async () => {
        if (!currentInstance) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError('');
        const { startDate, endDate } = rangeDates(range);
        const res = await api.get<AnalyticsSummary>(
            `/cms/analytics/summary?startDate=${startDate}&endDate=${endDate}`,
        );
        if (res.success && res.data) {
            setData(res.data);
        } else {
            setError(res.error?.message || 'Failed to load analytics.');
        }
        setIsLoading(false);
    }, [currentInstance, range]);

    useEffect(() => {
        void loadAnalytics();
    }, [loadAnalytics]);

    const statCards = useMemo(() => {
        if (!data?.totals) return [];
        return [
            {
                label: 'Sessions',
                value: formatNumber(data.totals.sessions),
                icon: Activity,
            },
            {
                label: 'Users',
                value: formatNumber(data.totals.users),
                icon: Users,
            },
            {
                label: 'Avg. Session',
                value: formatDuration(data.totals.avgSessionDuration),
                icon: Clock,
            },
        ];
    }, [data]);

    if (!currentInstance) {
        return (
            <div className="be-card flex min-h-[320px] items-center justify-center p-6 text-center">
                <div>
                    <BarChart3 className="mx-auto mb-3 h-8 w-8 text-[#dc2626]" />
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Select a website</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Choose an active website from the switcher to view its traffic analytics.
                    </p>
                </div>
            </div>
        );
    }

    const isConfigured = data?.configured === true;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#dc2626]/15 bg-[#dc2626]/5 px-3 py-1 text-xs font-semibold text-[#dc2626]">
                        <Globe2 className="h-3.5 w-3.5" />
                        Analytics
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Traffic Analytics</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                        Google Analytics 4 traffic for {currentInstance.name}.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {RANGE_OPTIONS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setRange(option)}
                            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                                range === option
                                    ? 'border-[#dc2626] bg-[#dc2626] text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                            }`}
                        >
                            Last {option} days
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="be-card flex min-h-[320px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading analytics...
                </div>
            ) : error ? (
                <div className="be-card flex min-h-[200px] items-center justify-center text-sm font-medium text-red-700 dark:text-red-200">
                    {error}
                </div>
            ) : !isConfigured ? (
                <div className="be-card flex min-h-[320px] flex-col items-center justify-center gap-3 p-6 text-center">
                    <BarChart3 className="h-10 w-10 text-[#dc2626]" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Connect Google Analytics</h2>
                    <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                        Add your GA4 Measurement ID and Property ID in Website Settings, then publish the website.
                        The dashboard will then show real traffic for this site.
                    </p>
                    <Link
                        href="/dashboard/website-settings"
                        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#dc2626]/25 transition hover:bg-[#b91c1c]"
                    >
                        Open Website Settings
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {statCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <div key={card.label} className="be-card flex items-center gap-4 p-5">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#dc2626]/10 text-[#dc2626]">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <section className="be-card p-5">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                                <Activity className="h-5 w-5 text-[#dc2626]" />
                                Sessions & Users Over Time
                            </h2>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={data?.byDate ?? []} margin={{ left: -16, right: 8, top: 8 }}>
                                    <defs>
                                        <linearGradient id="sess" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#dc2626" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="usr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#7f1d1d" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#7f1d1d" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(value: string) => value.slice(5)}
                                        minTickGap={24}
                                    />
                                    <YAxis tick={{ fontSize: 11 }} width={48} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, fontSize: 12 }}
                                        labelFormatter={(label) => `Date: ${label}`}
                                    />
                                    <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#dc2626" fill="url(#sess)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="users" name="Users" stroke="#7f1d1d" fill="url(#usr)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </section>

                        <section className="be-card p-5">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                                <BarChart3 className="h-5 w-5 text-[#dc2626]" />
                                Traffic by Channel
                            </h2>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={data?.bySource ?? []} layout="vertical" margin={{ left: 24, right: 16 }}>
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="channel" tick={{ fontSize: 11 }} width={110} />
                                    <Tooltip cursor={{ fill: 'rgba(220,38,38,0.08)' }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                                    <Bar dataKey="sessions" name="Sessions" fill="#dc2626" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </section>

                        <section className="be-card p-5">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                                <Smartphone className="h-5 w-5 text-[#dc2626]" />
                                Sessions by Device
                            </h2>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={data?.byDevice ?? []}
                                        dataKey="sessions"
                                        nameKey="device"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={(entry: { device: string; sessions: number }) => `${entry.device}: ${formatNumber(entry.sessions)}`}
                                        labelLine={false}
                                    >
                                        {(data?.byDevice ?? []).map((entry, index) => (
                                            <Cell key={entry.device} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </section>

                        <section className="be-card p-5">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                                <MousePointerClick className="h-5 w-5 text-[#dc2626]" />
                                Top Pages
                            </h2>
                            <div className="space-y-3">
                                {(data?.topPages ?? []).slice(0, 8).map((page, index) => (
                                    <div key={page.path} className="flex items-center justify-between gap-3 text-sm">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dc2626]/10 text-xs font-semibold text-[#dc2626]">
                                                {index + 1}
                                            </span>
                                            <span className="truncate font-mono text-slate-700 dark:text-slate-300">{page.path}</span>
                                        </div>
                                        <span className="shrink-0 font-semibold text-slate-900 dark:text-white">
                                            {formatNumber(page.views)}
                                        </span>
                                    </div>
                                ))}
                                {(data?.topPages ?? []).length === 0 && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No page views in this period.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}
