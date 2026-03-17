'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    CalendarCheck2,
    Briefcase,
    Users,
    PaintBucket,
    Building2,
    ShieldCheck,
    Globe2,
    ArrowRight,
    CreditCard,
    CheckCircle2,
    Circle,
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { api } from '../../lib/api-client';
import { getInstanceDisplayDomain } from '../../lib/domain';
import { TenantSwitcher } from '../../components/tenant-switcher';

const DASHBOARD_GUIDE_STORAGE_KEY = 'dashboardQuickGuide/v1';

interface ServiceSummary {
    id: string;
}

interface PublishHistoryItem {
    id: string;
    status: string;
}

interface ManualChecklistState {
    builder: boolean;
    publish: boolean;
}

interface SetupStep {
    id: string;
    title: string;
    description: string;
    href: string;
    done: boolean;
    manualKey?: keyof ManualChecklistState;
}

export default function DashboardPage() {
    const { user, currentTenant, currentInstance, tenants, instances } = useAuth();
    const [serviceCount, setServiceCount] = useState(0);
    const [hasPublishedWebsite, setHasPublishedWebsite] = useState(false);
    const [manualChecklist, setManualChecklist] = useState<ManualChecklistState>({
        builder: false,
        publish: false,
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const raw = window.localStorage.getItem(DASHBOARD_GUIDE_STORAGE_KEY);
            if (!raw) {
                return;
            }

            const parsed = JSON.parse(raw) as Partial<ManualChecklistState>;
            setManualChecklist({
                builder: parsed.builder === true,
                publish: parsed.publish === true,
            });
        } catch {
            // Ignore malformed storage.
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            window.localStorage.setItem(DASHBOARD_GUIDE_STORAGE_KEY, JSON.stringify(manualChecklist));
        } catch {
            // Ignore storage failures.
        }
    }, [manualChecklist]);

    useEffect(() => {
        let isCancelled = false;

        async function loadServiceCount() {
            if (!currentTenant || !currentInstance?.id) {
                if (!isCancelled) {
                    setServiceCount(0);
                }
                return;
            }

            const res = await api.get<ServiceSummary[]>('/cms/services');
            if (isCancelled) {
                return;
            }

            if (res.success && Array.isArray(res.data)) {
                setServiceCount(res.data.length);
            } else {
                setServiceCount(0);
            }
        }

        void loadServiceCount();

        return () => {
            isCancelled = true;
        };
    }, [currentTenant?.id, currentInstance?.id]);

    useEffect(() => {
        let isCancelled = false;

        async function loadPublishStatus() {
            if (!currentTenant || !currentInstance?.id) {
                if (!isCancelled) {
                    setHasPublishedWebsite(false);
                }
                return;
            }

            const res = await api.get<PublishHistoryItem[]>('/cms/builder/publish/history');
            if (isCancelled) {
                return;
            }

            if (res.success && Array.isArray(res.data)) {
                setHasPublishedWebsite(res.data.some((record) => record.status === 'published'));
            } else {
                setHasPublishedWebsite(false);
            }
        }

        void loadPublishStatus();

        return () => {
            isCancelled = true;
        };
    }, [currentTenant?.id, currentInstance?.id]);

    const setupSteps = useMemo<SetupStep[]>(() => {
        const hasWebsite = instances.length > 0;
        const hasServices = serviceCount > 0;

        return [
            {
                id: 'website',
                title: 'Create your first website',
                description: hasWebsite
                    ? 'Website created. You can manage it from Instances.'
                    : 'Start by creating your first website.',
                href: '/dashboard/instances/new',
                done: hasWebsite,
            },
            {
                id: 'services',
                title: 'Add services customers can book',
                description: hasServices
                    ? `${serviceCount} service${serviceCount === 1 ? '' : 's'} added.`
                    : hasWebsite
                        ? 'Add at least one service to start accepting bookings.'
                        : 'Create a website first, then add services.',
                href: '/dashboard/services',
                done: hasServices,
            },
            {
                id: 'builder',
                title: 'Customize pages in Website Builder',
                description: 'Optional guide step: tailor your pages, branding, and sections.',
                href: '/dashboard/builder',
                done: manualChecklist.builder,
                manualKey: 'builder',
            },
            {
                id: 'publish',
                title: 'Publish your website when ready',
                description: 'Optional guide step: open Builder and publish your latest changes.',
                href: '/dashboard/builder',
                done: manualChecklist.publish,
                manualKey: 'publish',
            },
        ];
    }, [instances.length, manualChecklist.builder, manualChecklist.publish, serviceCount]);

    const completedSteps = setupSteps.filter((step) => step.done).length;
    const nextStep = setupSteps.find((step) => !step.done) || null;

    function toggleManualStep(step: SetupStep) {
        if (!step.manualKey) {
            return;
        }
        const key = step.manualKey;
        setManualChecklist((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    }

    const quickActions = [
        { label: 'Bookings', href: '/dashboard/bookings', icon: CalendarCheck2 },
        { label: 'Services', href: '/dashboard/services', icon: Briefcase },
        { label: 'Customers', href: '/dashboard/customers', icon: Users },
        { label: 'Website Builder', href: '/dashboard/builder', icon: PaintBucket },
        { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    ];

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#5048e5] to-[#3e38b6] p-7 text-white shadow-lg shadow-[#5048e5]/20">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Dashboard Overview</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">
                    Welcome back, {user?.fullName?.split(' ')[0] || 'there'}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-white/85">
                    {currentTenant
                        ? `You are managing ${currentTenant.businessName}.`
                        : 'Select an organization to begin managing your booking platform.'}
                </p>
            </section>

            {!hasPublishedWebsite && (
                <section className="be-card overflow-hidden p-0">
                    <div className="border-b border-slate-200 bg-gradient-to-r from-[#f2f1ff] to-[#eef2ff] px-5 py-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">Getting Started</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    Follow these simple steps to launch your booking website.
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                                <CheckCircle2 className="h-4 w-4 text-[#5048e5]" />
                                {completedSteps}/{setupSteps.length} completed
                            </div>
                        </div>

                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/80 dark:bg-slate-800">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#5048e5] to-[#6a63ff] transition-all"
                                style={{ width: `${(completedSteps / setupSteps.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-5 p-5">
                        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Team</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    Switch team before creating services or publishing.
                                </p>
                            </div>
                            <div className="w-full lg:w-[320px]">
                                <TenantSwitcher />
                                {tenants.length <= 1 && (
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        You currently have one team.
                                    </p>
                                )}
                            </div>
                        </div>

                        {nextStep && (
                            <div className="rounded-xl border border-[#5048e5]/20 bg-[#5048e5]/5 px-3.5 py-3 text-sm text-slate-700 dark:border-[#5048e5]/40 dark:bg-[#5048e5]/10 dark:text-slate-200">
                                Next recommended step: <span className="font-semibold">{nextStep.title}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                            {setupSteps.map((step, index) => (
                                <div
                                    key={step.id}
                                    className={`rounded-xl border p-4 transition ${
                                        step.done
                                            ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-900/10'
                                            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {step.manualKey ? (
                                            <button
                                                type="button"
                                                onClick={() => toggleManualStep(step)}
                                                className="mt-0.5 text-[#5048e5]"
                                                aria-label={`${step.done ? 'Mark not done' : 'Mark done'}: ${step.title}`}
                                            >
                                                {step.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                            </button>
                                        ) : (
                                            <span className="mt-0.5 text-[#5048e5]">
                                                {step.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                            </span>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Step {index + 1}: {step.title}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                            step.done
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                        }`}>
                                            {step.done ? 'Done' : 'Pending'}
                                        </span>

                                        <Link
                                            href={step.href}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#5048e5] hover:text-[#433bcf]"
                                        >
                                            Open
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {currentTenant && (
                <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
                    <div className="be-card p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Website</p>
                            <Building2 className="h-5 w-5 text-[#5048e5]" />
                        </div>
                        <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                            {currentInstance?.name || 'No website selected'}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                            {currentInstance ? getInstanceDisplayDomain(currentInstance) : 'Create or select a website'}
                        </p>
                    </div>

                    <div className="be-card p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Role</p>
                            <ShieldCheck className="h-5 w-5 text-[#5048e5]" />
                        </div>
                        <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{currentTenant.role}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {currentTenant.isOwner ? 'Owner-level access' : `${currentTenant.permissions.length} active permissions`}
                        </p>
                    </div>

                    <div className="be-card p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Websites</p>
                            <Globe2 className="h-5 w-5 text-[#5048e5]" />
                        </div>
                        <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{instances.length}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Total websites in active org</p>
                    </div>

                    <div className="be-card p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Organizations</p>
                            <Users className="h-5 w-5 text-[#5048e5]" />
                        </div>
                        <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{tenants.length}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {tenants.length === 1 ? 'Single organization access' : 'Multi-organization access'}
                        </p>
                    </div>

                    <div className="be-card p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Plan</p>
                            <CreditCard className="h-5 w-5 text-[#5048e5]" />
                        </div>
                        <p className="mt-2 text-xl font-bold capitalize text-slate-900 dark:text-white">{currentTenant.plan}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Instances {currentTenant.usageSummary.instances.used}
                            {currentTenant.usageSummary.instances.limit === null
                                ? ' / Unlimited'
                                : ` / ${currentTenant.usageSummary.instances.limit}`}
                        </p>
                    </div>
                </section>
            )}

            <section className="be-card p-6">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick Actions</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Jump directly into your most-used management areas.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {quickActions.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-[#5048e5]/30 hover:bg-[#5048e5]/5 dark:border-slate-700 dark:bg-slate-900"
                            >
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#5048e5]/10 text-[#5048e5]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                                <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#5048e5]">
                                    Open
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
