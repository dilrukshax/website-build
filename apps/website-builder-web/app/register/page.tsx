'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { ArrowRight, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { ThemeToggle } from '../../components/theme-toggle';
import { api } from '../../lib/api-client';
import { useDeviceFingerprint } from '../../hooks/useDeviceFingerprint';
import type { FingerprintResult } from '../../lib/fingerprint/types';
import {
    clearOnboardingReferralOutcome,
    runPostRegistrationReferralFlow,
    saveOnboardingReferralOutcome,
} from '../../lib/referrals/referralPostRegistration';

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
});

const FINGERPRINT_ENABLED = process.env.NEXT_PUBLIC_FINGERPRINT_ENABLED === 'true';
const REFERRAL_STORAGE_KEY = 'pendingReferralCode';
const PRODUCT_BASED_REGISTER_URL = 'https://easyonlineweb.com/user/admin/auth/view/register.php';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RULES = [
    { key: 'length', label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
    { key: 'upper', label: 'At least one uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
    { key: 'lower', label: 'At least one lowercase letter', test: (value: string) => /[a-z]/.test(value) },
    { key: 'number', label: 'At least one number', test: (value: string) => /[0-9]/.test(value) },
] as const;

type RegisterField = 'email' | 'password' | 'confirmPassword' | 'fullName' | 'whatsappNumber';
type RegistrationMode = 'service';

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { register } = useAuth();
    const { fingerprintData } = useDeviceFingerprint();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        whatsappNumber: '',
    });
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterField, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationMode, setRegistrationMode] = useState<RegistrationMode | null>(null);
    const passwordRuleStatus = PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(formData.password) }));

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const fromQuery = searchParams.get('ref')?.trim().toUpperCase() || '';
        if (fromQuery) {
            sessionStorage.setItem(REFERRAL_STORAGE_KEY, fromQuery);
            setReferralCode(fromQuery);
            return;
        }

        const fromStorage = sessionStorage.getItem(REFERRAL_STORAGE_KEY)?.trim().toUpperCase() || '';
        setReferralCode(fromStorage || null);
    }, [searchParams]);

    function updateField(field: RegisterField, value: string) {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError('');
        setFieldErrors((prev) => ({
            ...prev,
            [field]: undefined,
            ...(field === 'password' ? { confirmPassword: undefined } : {}),
        }));
    }

    function isRegisterField(field: string): field is RegisterField {
        return field === 'email'
            || field === 'password'
            || field === 'confirmPassword'
            || field === 'fullName'
            || field === 'whatsappNumber';
    }

    function mapServerFieldToRegisterField(rawField: string): RegisterField | null {
        const normalized = rawField.trim().toLowerCase();

        if (!normalized) return null;
        if (normalized.endsWith('confirm_password') || normalized.endsWith('confirmpassword')) return 'confirmPassword';
        if (normalized.endsWith('full_name') || normalized.endsWith('fullname')) return 'fullName';
        if (normalized.endsWith('whatsapp_number') || normalized.endsWith('whatsappnumber') || normalized.endsWith('whatsapp')) return 'whatsappNumber';
        if (normalized.endsWith('email')) return 'email';
        if (normalized.endsWith('password')) return 'password';

        return null;
    }

    function validateForm() {
        const trimmedEmail = formData.email.trim();
        const trimmedFullName = formData.fullName.trim();
        const trimmedWhatsappNumber = formData.whatsappNumber.trim();
        const errors: Partial<Record<RegisterField, string>> = {};

        if (!trimmedFullName) {
            errors.fullName = 'Full name is required';
        }

        if (!trimmedWhatsappNumber) {
            errors.whatsappNumber = 'WhatsApp number is required';
        }

        if (!trimmedEmail) {
            errors.email = 'Email is required';
        } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
            errors.email = 'Enter a valid email address';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (!PASSWORD_RULES.every((rule) => rule.test(formData.password))) {
            errors.password = 'Password does not meet all requirements';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        return { trimmedEmail, trimmedFullName, trimmedWhatsappNumber, errors };
    }

    function applyServerFieldErrors(details?: Array<{ field: string; message: string }>) {
        if (!details?.length) {
            return false;
        }

        const nextErrors: Partial<Record<RegisterField, string>> = {};
        for (const detail of details) {
            const mappedField = mapServerFieldToRegisterField(detail.field) || (isRegisterField(detail.field) ? detail.field : null);
            if (mappedField && !nextErrors[mappedField]) {
                nextErrors[mappedField] = detail.message;
            }
        }

        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
            return true;
        }

        return false;
    }

    async function runPostRegistrationTasks(input: {
        userId?: string;
        referralCode: string | null;
        fingerprintData: FingerprintResult | null;
    }): Promise<void> {
        const outcome = await runPostRegistrationReferralFlow(api, {
            userId: input.userId,
            referralCode: input.referralCode,
            fingerprintData: input.fingerprintData,
            fingerprintEnabled: FINGERPRINT_ENABLED,
        });

        if (outcome.status === 'skipped_no_code') {
            clearOnboardingReferralOutcome();
            return;
        }

        saveOnboardingReferralOutcome(outcome);

        if ((outcome.status === 'claimed' || outcome.status === 'blocked') && typeof window !== 'undefined') {
            sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        const { trimmedEmail, trimmedFullName, trimmedWhatsappNumber, errors } = validateForm();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await register({
                email: trimmedEmail,
                password: formData.password,
                fullName: trimmedFullName,
                whatsappNumber: trimmedWhatsappNumber,
                _deviceFingerprint: fingerprintData ?? null,
                referralCode,
            });

            if (result.success) {
                void runPostRegistrationTasks({
                    userId: result.userId,
                    referralCode,
                    fingerprintData: fingerprintData ?? null,
                });
                router.push('/onboarding/create-organization');
            } else {
                const hasFieldErrors = applyServerFieldErrors(result.details);
                const mappedField = result.field ? mapServerFieldToRegisterField(result.field) : null;
                const isEmailAlreadyExists = result.code === 'EMAIL_ALREADY_EXISTS';
                const isPasswordRuleMessage = Boolean(
                    result.error && result.error.toLowerCase().includes('password must'),
                );

                if (!hasFieldErrors && mappedField && result.error) {
                    setFieldErrors((prev) => ({ ...prev, [mappedField]: result.error }));
                }

                if (!hasFieldErrors && isEmailAlreadyExists) {
                    setFieldErrors((prev) => ({ ...prev, email: result.error || 'A user with this email already exists' }));
                }

                if (!hasFieldErrors && isPasswordRuleMessage && result.error) {
                    setFieldErrors((prev) => ({ ...prev, password: result.error }));
                }

                const showGenericValidationMessage = result.code === 'VALIDATION_ERROR'
                    && (!result.error || result.error === 'Validation failed');

                setError(
                    hasFieldErrors || Boolean(mappedField) || isEmailAlreadyExists || isPasswordRuleMessage
                        ? ''
                        : showGenericValidationMessage
                            ? 'Please check your form details and password requirements.'
                            : (result.error || 'Registration failed'),
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleProductBasedRedirect() {
        if (typeof window !== 'undefined') {
            window.location.assign(PRODUCT_BASED_REGISTER_URL);
        }
    }

    return (
        <div className={`${inter.className} min-h-screen bg-[#f6f6f8] text-slate-900 dark:bg-[#121121] dark:text-slate-100`}>
            <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#dc2626] via-[#b91c1c] to-[#7f1d1d] p-12 text-white lg:flex lg:flex-col lg:justify-between">
                    <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                    <div className="pointer-events-none absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

                    <Link href="/" className="relative z-10 inline-flex items-center gap-2 text-white/95">
                        <Sparkles className="h-5 w-5" />
                        <span className="text-lg font-semibold">Aurora</span>
                    </Link>

                    <div className="relative z-10">
                        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Create Account</p>
                        <h1 className="max-w-lg text-5xl font-black leading-tight">
                            Build your website and launch booking in one minute.
                        </h1>
                        <p className="mt-6 max-w-lg text-base leading-relaxed text-white/85">
                            Register once and start using the visual website builder with built-in backend booking services.
                        </p>
                    </div>

                    <div className="space-y-3 text-sm text-white/90">
                        <p className="inline-flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Website builder with instant launch
                        </p>
                        <p className="inline-flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Built-in Aurora workflows and backend APIs
                        </p>
                        <p className="inline-flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Multi-tenant setup for teams and agencies
                        </p>
                    </div>
                </section>

                <section className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
                    <div className="absolute right-5 top-5 z-20">
                        <ThemeToggle fullWidth={false} align="right" />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(80,72,229,0.12),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(80,72,229,0.08),transparent_45%)]" />
                    <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-8">
                            <Link href="/" className="inline-flex items-center gap-2 text-[#dc2626] lg:hidden">
                                <Sparkles className="h-5 w-5" />
                                <span className="text-base font-semibold">Aurora</span>
                            </Link>
                            <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">
                                {registrationMode === 'service' ? 'Create account' : 'Choose your business type'}
                            </h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                {registrationMode === 'service'
                                    ? 'Set up your workspace and start building your live website.'
                                    : 'Are you service-based or product-based?'}
                            </p>
                        </div>

                        {registrationMode === null ? (
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => setRegistrationMode('service')}
                                    className="inline-flex w-full items-center justify-between rounded-xl border border-[#dc2626]/35 bg-[#dc2626]/10 px-4 py-3 text-left text-sm font-semibold text-[#dc2626] transition hover:bg-[#dc2626]/15"
                                >
                                    Service-based business
                                    <ArrowRight className="h-4 w-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleProductBasedRedirect}
                                    className="inline-flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Product-based business
                                    <ArrowRight className="h-4 w-4" />
                                </button>

                                <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Product-based registration will continue on easyonlineweb.
                                </p>

                                <p className="pt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                                    Already have an account?{' '}
                                    <Link href="/login" className="font-semibold text-[#dc2626] hover:text-[#3e38b6]">
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRegistrationMode(null);
                                        setError('');
                                        setFieldErrors({});
                                    }}
                                    className="mb-4 inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Change business type
                                </button>

                                {error && (
                                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                                        {error}
                                    </div>
                                )}

                                {referralCode && (
                                    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                                        Referral code applied: <span className="font-semibold">{referralCode}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Full name
                                        </label>
                                        <input
                                            id="fullName"
                                            type="text"
                                            required
                                            value={formData.fullName}
                                            onChange={(e) => updateField('fullName', e.target.value)}
                                            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 dark:bg-slate-950 dark:text-slate-100 ${fieldErrors.fullName ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'}`}
                                            placeholder="John Doe"
                                        />
                                        {fieldErrors.fullName && (
                                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.fullName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="whatsappNumber" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            WhatsApp number
                                        </label>
                                        <input
                                            id="whatsappNumber"
                                            type="tel"
                                            required
                                            autoComplete="tel"
                                            value={formData.whatsappNumber}
                                            onChange={(e) => updateField('whatsappNumber', e.target.value)}
                                            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 dark:bg-slate-950 dark:text-slate-100 ${fieldErrors.whatsappNumber ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'}`}
                                            placeholder="+94 77 123 4567"
                                        />
                                        {fieldErrors.whatsappNumber && (
                                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.whatsappNumber}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Email address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            value={formData.email}
                                            onChange={(e) => updateField('email', e.target.value)}
                                            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 dark:bg-slate-950 dark:text-slate-100 ${fieldErrors.email ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'}`}
                                            placeholder="you@example.com"
                                        />
                                        {fieldErrors.email && (
                                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Password
                                            </label>
                                            <input
                                                id="password"
                                                type="password"
                                                required
                                                autoComplete="new-password"
                                                value={formData.password}
                                                onChange={(e) => updateField('password', e.target.value)}
                                                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 dark:bg-slate-950 dark:text-slate-100 ${fieldErrors.password ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'}`}
                                                placeholder="Min 8 characters"
                                            />
                                            {fieldErrors.password && (
                                                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>
                                            )}
                                            <ul className="mt-2 space-y-1 text-xs">
                                                {passwordRuleStatus.map((rule) => (
                                                    <li
                                                        key={rule.key}
                                                        className={`inline-flex items-center gap-1.5 ${rule.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}
                                                    >
                                                        {rule.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                                                        {rule.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Confirm password
                                            </label>
                                            <input
                                                id="confirmPassword"
                                                type="password"
                                                required
                                                autoComplete="new-password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => updateField('confirmPassword', e.target.value)}
                                                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 dark:bg-slate-950 dark:text-slate-100 ${fieldErrors.confirmPassword ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'}`}
                                                placeholder="Re-enter password"
                                            />
                                            {fieldErrors.confirmPassword && (
                                                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.confirmPassword}</p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#dc2626]/25 transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSubmitting ? 'Creating account...' : 'Create account'}
                                        {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                                    </button>
                                </form>

                                <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                                    Already have an account?{' '}
                                    <Link href="/login" className="font-semibold text-[#dc2626] hover:text-[#3e38b6]">
                                        Sign in
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
