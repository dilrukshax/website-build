'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { api } from '../../lib/api-client';
import { getInstanceDisplayDomain } from '../../lib/domain';
import { DomainSupportContact } from '../../components/domain-support-contact';

interface ServiceSummary {
    id: string;
}

interface PublishHistoryItem {
    id: string;
    status: string;
}

interface SetupStep {
    id: string;
    title: string;
    description: string;
    href: string;
    done: boolean;
}

export default function DashboardPage() {
    const { currentTenant, currentInstance, loadInstances } = useAuth();
    const [serviceCount, setServiceCount] = useState(0);
    const [hasPublishedWebsite, setHasPublishedWebsite] = useState(false);

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
        const hasOrganization = Boolean(currentTenant);
        const hasServices = serviceCount > 0;
        const hasCustomizedWebsite = hasPublishedWebsite;

        return [
            {
                id: 'organization',
                title: 'Create your oraganazation',
                description: hasOrganization
                    ? 'Organization is created and ready.'
                    : 'Create your organization to continue setup.',
                href: '/onboarding/create-organization',
                done: hasOrganization,
            },
            {
                id: 'services',
                title: 'Add services',
                description: hasServices
                    ? `${serviceCount} service${serviceCount === 1 ? '' : 's'} added.`
                    : 'Add your first service customers can book.',
                href: '/dashboard/services',
                done: hasServices,
            },
            {
                id: 'customize',
                title: 'Customize web site',
                description: hasCustomizedWebsite
                    ? 'Website customizations were published.'
                    : 'Open Website Builder and customize your pages.',
                href: '/dashboard/builder',
                done: hasCustomizedWebsite,
            },
        ];
    }, [currentTenant, hasPublishedWebsite, serviceCount]);

    const customDomain = currentInstance?.customDomain?.trim().toLowerCase() || '';
    const hasCustomDomain = Boolean(customDomain);
    const domainForMessage = customDomain || getInstanceDisplayDomain(currentInstance) || 'yourdomain.com';

    const hostnameStatus = (currentInstance?.customDomainHostnameStatus || '').toLowerCase();
    const sslStatus = (currentInstance?.customDomainSslStatus || '').toLowerCase();
    const fallbackDomainConnected = Boolean(
        customDomain
        && (currentInstance?.customDomainIsActive === true
            || (hostnameStatus === 'active' && sslStatus === 'active')),
    );
    const domainConnected = fallbackDomainConnected;

    const domainStatusText = domainConnected
        ? `Your domain ${customDomain} is connected to your account.`
        : `Your domain ${customDomain} is currently under way to connect.`;
    const showDomainSetupSupport = hasCustomDomain && !domainConnected;

    useEffect(() => {
        if (!currentTenant?.id || !currentInstance?.id || !hasCustomDomain || domainConnected) {
            return;
        }

        void loadInstances();
        const intervalId = setInterval(() => {
            void loadInstances();
        }, 30000);

        return () => {
            clearInterval(intervalId);
        };
    }, [currentTenant?.id, currentInstance?.id, hasCustomDomain, domainConnected, loadInstances]);

    return (
        <div className="space-y-6">
            {hasCustomDomain && (
                <section className={`rounded-2xl border px-5 py-4 ${
                    domainConnected
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
                        : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
                }`}>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide dark:bg-slate-900/60">
                            {domainConnected ? 'Connected' : 'Pending'}
                        </span>
                        <p className="text-sm font-semibold">{domainStatusText}</p>
                    </div>
                    <p className="mt-1 text-xs">
                        {domainConnected
                            ? 'Domain setup is complete.'
                            : 'DNS connection usually takes 12 to 24 hours to complete.'}
                    </p>
                </section>
            )}

            {showDomainSetupSupport && (
                <section className="be-card p-6">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Domain Setup Support</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Need help connecting your domain? Contact support to finish setup.
                        </p>
                    </div>
                    <DomainSupportContact domain={domainForMessage} />
                </section>
            )}

            <section className="be-card overflow-hidden p-0">
                <div className="border-b border-slate-200 bg-gradient-to-r from-[#f2f1ff] to-[#fef2f2] px-5 py-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Getting Started</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Follow these 3 steps to launch your booking website.
                        </p>
                    </div>
                </div>

                <div className="space-y-4 p-5">
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                        {setupSteps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`rounded-xl border p-4 transition ${
                                    step.done
                                        ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-900/10'
                                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                                }`}
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-lg font-black ${
                                        step.done
                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                            : 'border-[#dc2626] bg-[#dc2626]/10 text-[#dc2626]'
                                    }`}>
                                        {step.done ? <Check className="h-6 w-6" /> : index + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Step {index + 1}: {step.title}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                            {step.description}
                                        </p>
                                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                            step.done
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                : 'bg-[#dc2626]/10 text-[#dc2626] dark:bg-[#dc2626]/20 dark:text-[#a9a4ff]'
                                        }`}>
                                            {step.done ? 'Completed' : 'Pending'}
                                        </span>
                                    </div>
                                    <Link
                                        href={step.href}
                                        className="inline-flex items-center gap-1 self-start rounded-lg border border-[#dc2626]/25 bg-[#dc2626]/10 px-3 py-1.5 text-xs font-semibold text-[#dc2626] transition hover:bg-[#dc2626]/15 hover:text-[#b91c1c] sm:self-center"
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
        </div>
    );
}
