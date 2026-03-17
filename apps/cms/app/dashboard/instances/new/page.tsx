'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { api } from '../../../../lib/api-client';
import { setStorageItem } from '../../../../lib/browser-storage';
import { useAuth } from '../../../../contexts/auth-context';
import { getPrimaryDomainSuffix } from '../../../../lib/domain';
import {
    WEBSITE_SETUP_INDUSTRY_SUGGESTIONS,
    WEBSITE_SETUP_TIMEZONE_SUGGESTIONS,
    generateAutoSubdomain,
    getDefaultWebsiteSetupFormData,
    mapWebsiteSetupServerField,
    sanitizeSubdomainInput,
    validateWebsiteSetupForm,
    type WebsiteSetupField,
    type WebsiteSetupFormData,
} from '../../../../lib/website-setup';

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

export default function NewInstancePage() {
    const router = useRouter();
    const { loadInstances, currentTenant } = useAuth();

    const [formData, setFormData] = useState<WebsiteSetupFormData>(() => ({
        ...getDefaultWebsiteSetupFormData(),
        timezone: getDefaultWebsiteSetupFormData().timezone,
    }));
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<WebsiteSetupField, string>>>({});
    const primaryDomainSuffix = getPrimaryDomainSuffix();
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const limitReached = currentTenant?.usageSummary.instances.limit !== null
        && currentTenant !== null
        && currentTenant.usageSummary.instances.used >= (currentTenant.usageSummary.instances.limit || 0);
    const hasValidSubdomain = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(formData.subdomain) && formData.subdomain.length >= 3;

    function updateField(field: WebsiteSetupField, value: string) {
        const nextValue = field === 'subdomain'
            ? sanitizeSubdomainInput(value)
            : field === 'customDomain'
                ? value.toLowerCase().replace(/\s+/g, '')
                : value;

        setFormData((prev) => ({ ...prev, [field]: nextValue }));
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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        if (limitReached) {
            setError('Your plan instance limit has been reached.');
            return;
        }

        const validation = validateWebsiteSetupForm(formData);
        if (Object.keys(validation.nextErrors).length > 0) {
            setFieldErrors(validation.nextErrors);
            return;
        }

        setIsSubmitting(true);

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
                setIsSubmitting(false);
                router.push('/dashboard/instances');
                return;
            }

            const customDomainFailure = domainRes.error?.message
                ? `Custom domain mapping failed: ${domainRes.error.message}`
                : 'Custom domain mapping failed.';
            setError(`Website created. ${customDomainFailure} Domain DNS/TLS is managed manually outside platform. You can finish it from dashboard instances.`);
            setIsSubmitting(false);
            setTimeout(() => {
                router.push('/dashboard/instances');
            }, 1300);
            return;
        }

        await loadInstances();
        setIsSubmitting(false);
        router.push('/dashboard/instances');
    }

    return (
        <>
            <div className="mx-auto w-full max-w-3xl space-y-6">
                <div className="mb-6">
                    <Link href="/dashboard/instances" className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                        <ArrowLeft className="h-4 w-4" />
                        Back to websites
                    </Link>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Create new website</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Set up a new booking website for your organization.</p>
                    {currentTenant && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Usage: {currentTenant.usageSummary.instances.used}
                            {currentTenant.usageSummary.instances.limit === null
                                ? ' / Unlimited'
                                : ` / ${currentTenant.usageSummary.instances.limit}`}
                        </p>
                    )}
                </div>

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                        {error}
                    </div>
                )}

                {limitReached && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                        Your current plan has reached the website limit.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="be-card space-y-5 p-6 md:p-7">
                    <div>
                        <p className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Domain mode</p>
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
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:bg-slate-900 dark:text-slate-100 ${fieldErrors.name ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'}`}
                            placeholder="Acme Booking Site"
                        />
                        {fieldErrors.name && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>
                        )}
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
                        {fieldErrors.subdomain && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.subdomain}</p>
                        )}
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
                                {fieldErrors.customDomain && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.customDomain}</p>
                                )}
                            </div>
                        </>
                    )}

                    <div>
                        <label htmlFor="businessType" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Industry
                        </label>
                        <input
                            id="businessType"
                            type="text"
                            required
                            list="industry-suggestions"
                            value={formData.businessType}
                            onChange={(e) => updateField('businessType', e.target.value)}
                            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:bg-slate-900 dark:text-slate-100 ${fieldErrors.businessType ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'}`}
                            placeholder="Salon & Spa"
                        />
                        <datalist id="industry-suggestions">
                            {WEBSITE_SETUP_INDUSTRY_SUGGESTIONS.map((item) => (
                                <option key={item} value={item} />
                            ))}
                        </datalist>
                        {fieldErrors.businessType && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.businessType}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="timezone" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Website timezone
                        </label>
                        <input
                            id="timezone"
                            type="text"
                            list="timezone-suggestions"
                            value={formData.timezone}
                            onChange={(e) => updateField('timezone', e.target.value)}
                            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:bg-slate-900 dark:text-slate-100 ${fieldErrors.timezone ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'}`}
                            placeholder="Asia/Colombo"
                        />
                        <datalist id="timezone-suggestions">
                            {WEBSITE_SETUP_TIMEZONE_SUGGESTIONS.map((item) => (
                                <option key={item} value={item} />
                            ))}
                        </datalist>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Info className="h-3.5 w-3.5" />
                            Booking windows use this timezone.
                        </p>
                        {fieldErrors.timezone && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.timezone}</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                        <button
                            type="submit"
                            disabled={isSubmitting || limitReached}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5048e5] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#5048e5]/25 transition hover:bg-[#433bcf] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {limitReached ? 'Instance limit reached' : isSubmitting ? 'Creating website...' : 'Create website'}
                            {!isSubmitting && !limitReached && <ArrowRight className="h-4 w-4" />}
                        </button>
                        <Link
                            href="/dashboard/instances"
                            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>

        </>
    );
}
