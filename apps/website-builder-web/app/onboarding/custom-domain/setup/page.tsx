'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { ArrowRight, Check, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { ThemeToggle } from '../../../../components/theme-toggle';
import { DomainSupportContact } from '../../../../components/domain-support-contact';
import { api } from '../../../../lib/api-client';
import { setStorageItem } from '../../../../lib/browser-storage';

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
});

interface CustomDomainSetupResponse {
    hostname: string;
    customDomain?: string;
}

interface CustomDomainCheckResponse {
    hostname: string;
    lookupHost: string;
    status: string;
    isActive: boolean;
    requiredNameservers: string[];
    actualNameservers: string[];
    missingNameservers: string[];
    code?: string | null;
}

type CopyField = string | null;

export default function CustomDomainSetupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const instanceId = useMemo(() => searchParams.get('instanceId')?.trim() || '', [searchParams]);

    const [setupData, setSetupData] = useState<CustomDomainSetupResponse | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [copiedField, setCopiedField] = useState<CopyField>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [checkResult, setCheckResult] = useState<CustomDomainCheckResponse | null>(null);
    const [checkError, setCheckError] = useState('');

    useEffect(() => {
        if (!instanceId) {
            router.replace('/onboarding/create-organization?domainMode=customDomain');
            return;
        }

        setStorageItem('currentInstanceId', instanceId);
        let cancelled = false;

        async function loadSetup() {
            setIsLoading(true);
            const res = await api.get<CustomDomainSetupResponse>(
                `/cms/instances/${instanceId}/custom-domain/setup`,
                { omitInstanceHeader: true },
            );

            if (cancelled) {
                return;
            }

            if (!res.success || !res.data) {
                setError(res.error?.message || 'Unable to load custom domain setup details.');
                setIsLoading(false);
                return;
            }

            setSetupData(res.data);
            setIsLoading(false);
        }

        void loadSetup();

        return () => {
            cancelled = true;
        };
    }, [instanceId, router]);

    async function copyValue(field: string, value: string) {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedField(field);
            setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1500);
        } catch {
            setError('Copy failed. Please copy manually.');
        }
    }

    async function handleCheckConnection() {
        if (!instanceId) {
            return;
        }

        setIsChecking(true);
        setCheckError('');
        const response = await api.post<CustomDomainCheckResponse>(
            `/cms/instances/${instanceId}/custom-domain/check`,
            undefined,
            { omitInstanceHeader: true },
        );
        setIsChecking(false);

        if (!response.success || !response.data) {
            setCheckResult(null);
            setCheckError(response.error?.message || 'Unable to check domain connection right now.');
            return;
        }

        setCheckResult(response.data);
    }

    function handleDone() {
        if (instanceId) {
            setStorageItem('currentInstanceId', instanceId);
        }
        router.push('/dashboard');
    }

    return (
        <div className={`${inter.className} min-h-screen bg-[#f6f6f8] text-slate-900 dark:bg-[#121121] dark:text-slate-100`}>
            <div className="absolute right-5 top-5 z-20">
                <ThemeToggle fullWidth={false} align="right" />
            </div>

            <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-5 py-10 sm:px-8 lg:px-12">
                <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10 dark:border-slate-800 dark:bg-slate-900">
                    <Link href="/" className="inline-flex items-center gap-2 text-[#2563eb]">
                        <Sparkles className="h-5 w-5" />
                        <span className="text-base font-semibold">Project Aurora</span>
                    </Link>

                    <h1 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">Connect your domain</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Add your domain, wait for DNS propagation, and use support contact if you need help.
                    </p>

                    {error && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    {isLoading && (
                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                            Loading domain setup details...
                        </div>
                    )}

                    {!isLoading && setupData && (
                        <div className="mt-6 space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                                <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto] sm:items-center">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Domain</p>
                                    <code className="rounded-lg bg-white px-3 py-2 text-sm text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                                        {setupData.customDomain || setupData.hostname}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => copyValue('domain', setupData.customDomain || setupData.hostname)}
                                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        {copiedField === 'domain' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copiedField === 'domain' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">
                                DNS propagation can take a few minutes to several hours depending on your domain provider.
                            </div>

                            <DomainSupportContact domain={setupData.customDomain || setupData.hostname} />

                            {checkError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                                    {checkError}
                                </div>
                            )}

                            {checkResult && (
                                <div className={`rounded-xl border px-4 py-3 text-xs ${
                                    checkResult.isActive
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200'
                                        : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200'
                                }`}>
                                    <p className="font-semibold">
                                        {checkResult.isActive
                                            ? 'Domain is connected and active.'
                                            : 'Domain is not connected yet.'}
                                    </p>
                                    <p className="mt-1">
                                        Checked zone: <code>{checkResult.lookupHost || checkResult.hostname}</code>
                                    </p>
                                    {!checkResult.isActive && (
                                        <p className="mt-1">
                                            Setup is still pending. Contact support if this status does not change after propagation.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => void handleCheckConnection()}
                            disabled={isLoading || isChecking}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            {isChecking ? 'Checking...' : 'Check connection'}
                        </button>
                        <button
                            type="button"
                            onClick={handleDone}
                            disabled={isLoading}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/25 transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Done, go to dashboard
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <a
                            href="https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            DNS help
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
