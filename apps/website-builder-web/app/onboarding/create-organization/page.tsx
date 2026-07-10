'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { ArrowRight, CheckCircle2, Circle, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../../contexts/auth-context';
import { api } from '../../../lib/api-client';
import { setStorageItem } from '../../../lib/browser-storage';
import { getPrimaryDomainSuffix } from '../../../lib/domain';
import {
    buildWorkspaceName,
    clearOnboardingWebsiteSetupDraft,
    generateAutoSubdomain,
    getDefaultWebsiteSetupFormData,
    loadOnboardingWebsiteSetupDraft,
    mapWebsiteSetupServerField,
    sanitizeSubdomainInput,
    saveOnboardingWebsiteSetupDraft,
    validateWebsiteSetupForm,
    type WebsiteSetupField,
    type WebsiteSetupFormData,
} from '../../../lib/website-setup';
import { ThemeToggle } from '../../../components/theme-toggle';
import {
    consumeOnboardingReferralOutcome,
    getOnboardingReferralNotice,
    type ReferralOutcomeNotice,
} from '../../../lib/referrals/referralPostRegistration';

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
});

interface CreatedInstance {
    id: string;
    name: string;
    subdomain: string;
    fullDomain?: string | null;
    customDomain?: string | null;
    customDomainHostnameStatus?: string | null;
    customDomainSslStatus?: string | null;
    customDomainIsActive?: boolean;
    customDomainLastCheckedAt?: string | null;
    customDomainActivatedAt?: string | null;
    timezone: string;
    businessType: string | null;
    status: string;
}

function isInstanceContextError(message?: string): boolean {
    return typeof message === 'string'
        && message.toLowerCase().includes('instance not found or inactive');
}

export default function CreateOrganizationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {
        createTenant,
        currentTenant,
        isLoading,
        loadInstances,
        switchTenant,
        tenants,
        user,
    } = useAuth();

    const [formData, setFormData] = useState<WebsiteSetupFormData>(() =>
        loadOnboardingWebsiteSetupDraft() || getDefaultWebsiteSetupFormData(),
    );
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<WebsiteSetupField, string>>>({});
    const [error, setError] = useState('');
    const [referralNotice, setReferralNotice] = useState<ReferralOutcomeNotice | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const primaryDomainSuffix = getPrimaryDomainSuffix();
    const hasValidSubdomain = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(formData.subdomain) && formData.subdomain.length >= 3;

    useEffect(() => {
        saveOnboardingWebsiteSetupDraft(formData);
    }, [formData]);

    useEffect(() => {
        const outcome = consumeOnboardingReferralOutcome();
        if (!outcome) {
            return;
        }

        setReferralNotice(getOnboardingReferralNotice(outcome));
    }, []);

    useEffect(() => {
        const requestedDomainMode = searchParams.get('domainMode');
        if (requestedDomainMode !== 'subdomain' && requestedDomainMode !== 'customDomain') {
            return;
        }

        setFormData((prev) => (
            prev.domainMode === requestedDomainMode
                ? prev
                : { ...prev, domainMode: requestedDomainMode }
        ));
    }, [searchParams]);

    function updateField(field: WebsiteSetupField, value: string) {
        const nextValue = field === 'subdomain'
            ? sanitizeSubdomainInput(value)
            : field === 'customDomain'
                ? value.toLowerCase().replace(/\s+/g, '')
                : value;

        setFormData((prev) => ({
            ...prev,
            [field]: nextValue,
        }));
        setError('');
        setFieldErrors((prev) => ({
            ...prev,
            [field]: undefined,
            ...(field === 'domainMode' ? { subdomain: undefined, customDomain: undefined } : {}),
        }));
    }

    function applyServerFieldErrors(details?: Array<{ field: string; message: string }>) {
        if (!details?.length) {
            return false;
        }

        const nextErrors: Partial<Record<WebsiteSetupField, string>> = {};
        let hiddenFieldError = '';
        for (const detail of details) {
            const mappedField = mapWebsiteSetupServerField(detail.field);
            if (mappedField === 'subdomain' && formData.domainMode === 'customDomain') {
                hiddenFieldError = detail.message;
                continue;
            }
            if (mappedField && !nextErrors[mappedField]) {
                nextErrors[mappedField] = detail.message;
            }
        }

        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
            if (hiddenFieldError) {
                setError(hiddenFieldError);
            }
            return true;
        }

        if (hiddenFieldError) {
            setError(hiddenFieldError);
            return true;
        }

        return false;
    }

    async function ensureTenantContext(): Promise<boolean> {
        if (currentTenant) {
            return true;
        }

        const firstTenant = tenants[0];
        if (firstTenant) {
            const switched = await switchTenant(firstTenant.id);
            if (!switched.success) {
                setError(switched.error || 'Unable to select organization workspace');
                return false;
            }
            return true;
        }

        const workspaceName = buildWorkspaceName({
            fullName: user?.fullName,
            email: user?.email,
        });

        const result = await createTenant(workspaceName);
        if (!result.success) {
            const hasFieldErrors = applyServerFieldErrors(result.details);
            if (!hasFieldErrors) {
                setError(result.error || 'Failed to create organization workspace');
            }
            return false;
        }

        return true;
    }

    async function createInstanceRecord(validation: ReturnType<typeof validateWebsiteSetupForm>) {
        const basePayload = {
            name: validation.cleanedName,
            businessType: validation.cleanedBusinessType,
            timezone: validation.cleanedTimezone,
        };

        if (validation.domainMode === 'subdomain') {
            return api.post<CreatedInstance>('/cms/instances', {
                ...basePayload,
                subdomain: validation.cleanedSubdomain,
            }, { omitInstanceHeader: true });
        }

        for (let attempt = 0; attempt < 3; attempt += 1) {
            const subdomain = generateAutoSubdomain({
                name: validation.cleanedName,
                customDomain: validation.cleanedCustomDomain,
                seed: `${Date.now().toString(36)}${attempt}`,
            });

            const response = await api.post<CreatedInstance>('/cms/instances', {
                ...basePayload,
                subdomain,
            }, { omitInstanceHeader: true });

            const isSubdomainConflict = !response.success
                && (response.error?.code === 'SUBDOMAIN_TAKEN' || response.error?.field === 'subdomain');

            if (!isSubdomainConflict || attempt === 2) {
                return response;
            }
        }

        return api.post<CreatedInstance>('/cms/instances', {
            ...basePayload,
            subdomain: generateAutoSubdomain({
                name: validation.cleanedName,
                customDomain: validation.cleanedCustomDomain,
            }),
        }, { omitInstanceHeader: true });
    }

    async function handleContinue(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        const validation = validateWebsiteSetupForm(formData);
        if (Object.keys(validation.nextErrors).length > 0) {
            setFieldErrors(validation.nextErrors);
            return;
        }

        setIsSubmitting(true);

        saveOnboardingWebsiteSetupDraft({
            name: validation.cleanedName,
            subdomain: validation.cleanedSubdomain,
            businessType: validation.cleanedBusinessType,
            timezone: validation.cleanedTimezone,
            customDomain: validation.cleanedCustomDomain,
            domainMode: validation.domainMode,
        });

        const hasTenant = await ensureTenantContext();
        if (!hasTenant) {
            setIsSubmitting(false);
            return;
        }

        const createRes = await createInstanceRecord(validation);

        if (!createRes.success || !createRes.data) {
            const hasFieldErrors = applyServerFieldErrors(createRes.error?.details);
            const mappedField = createRes.error?.field ? mapWebsiteSetupServerField(createRes.error.field) : null;

            if (!hasFieldErrors && mappedField === 'subdomain' && validation.domainMode === 'customDomain') {
                setError(createRes.error?.message || 'Unable to reserve internal website URL. Please try again.');
                setIsSubmitting(false);
                return;
            } else if (!hasFieldErrors && mappedField && createRes.error?.message) {
                setFieldErrors((prev) => ({ ...prev, [mappedField]: createRes.error!.message }));
            }

            const fallbackError = createRes.error?.message || 'Failed to create website';
            const showGenericValidationMessage = createRes.error?.code === 'VALIDATION_ERROR' && fallbackError === 'Validation failed';
            setError(
                hasFieldErrors || Boolean(mappedField)
                    ? ''
                    : showGenericValidationMessage
                        ? 'Please check your website details and try again.'
                        : fallbackError,
            );
            setIsSubmitting(false);
            return;
        }

        if (validation.domainMode === 'customDomain') {
            setStorageItem('currentInstanceId', createRes.data.id);
            let domainRes = await api.put(
                `/cms/instances/${createRes.data.id}/domain-route`,
                { host: validation.cleanedCustomDomain, active: true, isPrimary: true },
                { omitInstanceHeader: true },
            );

            if (!domainRes.success && isInstanceContextError(domainRes.error?.message)) {
                await loadInstances();
                setStorageItem('currentInstanceId', createRes.data.id);
                domainRes = await api.put(
                    `/cms/instances/${createRes.data.id}/domain-route`,
                    { host: validation.cleanedCustomDomain, active: true, isPrimary: true },
                    { omitInstanceHeader: true },
                );
            }

            await loadInstances();

            if (domainRes.success) {
                clearOnboardingWebsiteSetupDraft();
                setIsSubmitting(false);
                router.push(`/onboarding/custom-domain/setup?instanceId=${encodeURIComponent(createRes.data.id)}`);
                return;
            }

            clearOnboardingWebsiteSetupDraft();
            const customDomainFailure = domainRes.error?.message
                ? `Custom domain mapping failed: ${domainRes.error.message}`
                : 'Custom domain mapping failed.';
            setError(`Website created. ${customDomainFailure} Domain DNS/TLS is managed manually outside platform. You can finish it from dashboard.`);
            setIsSubmitting(false);
            setTimeout(() => {
                router.push('/dashboard');
            }, 1300);
            return;
        }

        await loadInstances();
        clearOnboardingWebsiteSetupDraft();
        setIsSubmitting(false);
        router.push('/dashboard');
    }

    async function handleSkip() {
        if (isSubmitting || isLoading) {
            return;
        }

        setError('');
        setFieldErrors({});
        setIsSubmitting(true);

        const hasTenant = await ensureTenantContext();
        if (hasTenant) {
            clearOnboardingWebsiteSetupDraft();
            router.push('/dashboard');
        }

        setIsSubmitting(false);
    }

    if (isLoading) {
        return (
            <div className={`${inter.className} min-h-screen bg-[#f6f6f8] dark:bg-[#121121]`} />
        );
    }

    return (
        <>
            <div className={`${inter.className} relative min-h-screen overflow-hidden bg-[#f6f6f8] text-slate-900 dark:bg-[#121121] dark:text-slate-100`}>
                <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#5048e5]/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-24 bottom-6 h-72 w-72 rounded-full bg-[#5048e5]/15 blur-3xl" />

            <div className="absolute right-5 top-5 z-30">
                <ThemeToggle fullWidth={false} align="right" />
            </div>

            <main className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
                <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="grid min-h-[82vh] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
                        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-[#5048e5] via-[#4b43d8] to-[#2f2a8c] p-8 text-white lg:border-b-0 lg:border-r lg:border-r-white/15 lg:p-10">
                            <div className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
                            <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

                            <div className="relative z-10 flex h-full flex-col justify-between">
                                <div>
                                    <Link href="/" className="inline-flex items-center gap-2 text-white/95">
                                        <Sparkles className="h-5 w-5" />
                                        <span className="text-base font-semibold">Project Aurora</span>
                                    </Link>

                                    <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Onboarding</p>
                                    <h1 className="mt-3 text-4xl font-black leading-tight">
                                        Set up your website details before launch.
                                    </h1>
                                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85">
                                        We will create your workspace automatically. Just enter your website setup details, domain mode,
                                        and continue onboarding.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 text-sm text-white/90">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#5048e5]">1</span>
                                        <span className="font-semibold">Website setup and create</span>
                                    </div>
                                    <p className="inline-flex items-center gap-2 text-sm text-white/85">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Your website is created immediately after submit.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="relative flex flex-col p-6 sm:p-8 lg:p-10">
                            <div className="mb-5 flex items-center justify-end">
                                <button
                                    type="button"
                                    onClick={handleSkip}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X className="h-4 w-4" />
                                    Skip for now (create later)
                                </button>
                            </div>

                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Website information</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Enter domain details and continue.
                                </p>
                            </div>

                            {referralNotice && (
                                <div
                                    className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                                        referralNotice.tone === 'warning'
                                            ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200'
                                            : 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200'
                                    }`}
                                >
                                    {referralNotice.message}
                                </div>
                            )}

                            {error && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleContinue} className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                                <div>
                                    <p className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Domain mode</p>
                                    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Domain mode">
                                        <label
                                            className={`flex cursor-pointer gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                                                formData.domainMode === 'subdomain'
                                                    ? 'border-[#5048e5] bg-[#5048e5]/10 text-[#5048e5]'
                                                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="domainMode"
                                                value="subdomain"
                                                checked={formData.domainMode === 'subdomain'}
                                                onChange={() => updateField('domainMode', 'subdomain')}
                                                className="mt-0.5 h-4 w-4 border-slate-300 text-[#5048e5] focus:ring-[#5048e5]"
                                            />
                                            <span>
                                                <p className="font-semibold">Subdomain</p>
                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Use your platform subdomain</p>
                                            </span>
                                        </label>
                                        <label
                                            className={`flex cursor-pointer gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                                                formData.domainMode === 'customDomain'
                                                    ? 'border-[#5048e5] bg-[#5048e5]/10 text-[#5048e5]'
                                                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="domainMode"
                                                value="customDomain"
                                                checked={formData.domainMode === 'customDomain'}
                                                onChange={() => updateField('domainMode', 'customDomain')}
                                                className="mt-0.5 h-4 w-4 border-slate-300 text-[#5048e5] focus:ring-[#5048e5]"
                                            />
                                            <span>
                                                <p className="font-semibold">Custom domain</p>
                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Connect your own domain</p>
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Website name
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        value={formData.name}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:bg-slate-900 dark:text-slate-100 ${fieldErrors.name ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'}`}
                                        placeholder="Acme Booking Site"
                                    />
                                    {fieldErrors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>}
                                </div>

                                {formData.domainMode === 'subdomain' && (
                                    <div>
                                    <label htmlFor="subdomain" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Subdomain
                                    </label>
                                    <div className="flex">
                                        <input
                                            id="subdomain"
                                            type="text"
                                            required
                                            value={formData.subdomain}
                                            onChange={(e) => updateField('subdomain', e.target.value)}
                                            className={`flex-1 rounded-l-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:z-10 focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:bg-slate-900 dark:text-slate-100 ${fieldErrors.subdomain ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'}`}
                                            placeholder="acme-bookings"
                                        />
                                        <span className="inline-flex items-center rounded-r-xl border border-l-0 border-slate-300 bg-slate-100 px-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {primaryDomainSuffix}
                                        </span>
                                    </div>
                                    <p className={`mt-1 text-xs ${hasValidSubdomain ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {hasValidSubdomain
                                            ? `Your site URL will be ${formData.subdomain}${primaryDomainSuffix}`
                                            : 'Use lowercase letters, numbers, and hyphens'}
                                    </p>
                                    {fieldErrors.subdomain && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.subdomain}</p>}
                                    </div>
                                )}

                                {formData.domainMode === 'customDomain' && (
                                    <>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                                            Internal subdomain is generated automatically for system routing.
                                        </div>
                                        <div>
                                            <label htmlFor="customDomain" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Custom domain
                                            </label>
                                            <input
                                                id="customDomain"
                                                type="text"
                                                required
                                                value={formData.customDomain}
                                                onChange={(e) => updateField('customDomain', e.target.value)}
                                                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:bg-slate-900 dark:text-slate-100 ${fieldErrors.customDomain ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'}`}
                                                placeholder="example.com"
                                            />
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Enter hostname only (no https:// and no path).
                                            </p>
                                            {fieldErrors.customDomain && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.customDomain}</p>}
                                        </div>
                                    </>
                                )}

                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">What happens next?</p>
                                    <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                                        <li className="inline-flex items-center gap-2">
                                            <Circle className="h-3.5 w-3.5 text-[#5048e5]" />
                                            We auto-create your workspace if it does not exist.
                                        </li>
                                        <li className="inline-flex items-center gap-2">
                                            <Circle className="h-3.5 w-3.5 text-[#5048e5]" />
                                            Website is created directly using these values.
                                        </li>
                                        <li className="inline-flex items-center gap-2">
                                            <Circle className="h-3.5 w-3.5 text-[#5048e5]" />
                                            Domain DNS/TLS is managed manually outside platform. We only map host routing after creation.
                                        </li>
                                    </ul>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5048e5] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#5048e5]/25 transition hover:bg-[#433bcf] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting ? 'Creating website...' : 'Create website'}
                                    {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                                </button>
                            </form>
                        </section>
                    </div>
                </div>
            </main>
            </div>

        </>
    );
}
