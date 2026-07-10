'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { ThemeToggle } from '../../components/theme-toggle';

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
});

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<'email' | 'password', string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    function mapServerFieldToLoginField(rawField: string): 'email' | 'password' | null {
        const normalized = rawField.trim().toLowerCase();
        if (!normalized) return null;
        if (normalized.endsWith('email')) return 'email';
        if (normalized.endsWith('password')) return 'password';
        return null;
    }

    function updateField(field: 'email' | 'password', value: string) {
        if (field === 'email') {
            setEmail(value);
        } else {
            setPassword(value);
        }
        setError('');
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    function validateForm() {
        const nextErrors: Partial<Record<'email' | 'password', string>> = {};
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            nextErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            nextErrors.email = 'Enter a valid email address';
        }

        if (!password) {
            nextErrors.password = 'Password is required';
        }

        return { trimmedEmail, nextErrors };
    }

    function applyServerFieldErrors(details?: Array<{ field: string; message: string }>) {
        if (!details?.length) {
            return false;
        }

        const nextErrors: Partial<Record<'email' | 'password', string>> = {};
        for (const detail of details) {
            const mappedField = mapServerFieldToLoginField(detail.field);
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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        const { trimmedEmail, nextErrors } = validateForm();
        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors);
            return;
        }

        setIsSubmitting(true);
        const result = await login(trimmedEmail, password);

        if (result.success) {
            const redirect = searchParams.get('redirect') || result.redirectTo || '/dashboard';
            router.push(redirect);
        } else {
            const hasFieldErrors = applyServerFieldErrors(result.details);
            const mappedField = result.field ? mapServerFieldToLoginField(result.field) : null;

            if (!hasFieldErrors && mappedField && result.error) {
                setFieldErrors((prev) => ({ ...prev, [mappedField]: result.error }));
            }

            if (!hasFieldErrors && result.code === 'INVALID_CREDENTIALS') {
                setFieldErrors((prev) => ({
                    ...prev,
                    password: 'Incorrect email or password',
                }));
            }

            const fallbackError = result.error || 'Login failed';
            const showGenericValidationMessage = result.code === 'VALIDATION_ERROR' && fallbackError === 'Validation failed';
            setError(
                hasFieldErrors || Boolean(mappedField) || result.code === 'INVALID_CREDENTIALS'
                    ? ''
                    : showGenericValidationMessage
                        ? 'Please check your email and password and try again.'
                        : fallbackError,
            );
        }

        setIsSubmitting(false);
    }

    return (
        <div className={`${inter.className} min-h-screen bg-[#f6f6f8] text-slate-900 dark:bg-[#121121] dark:text-slate-100`}>
            <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#5048e5] via-[#4b43d8] to-[#2f2a8c] p-12 text-white lg:flex lg:flex-col lg:justify-between">
                    <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                    <div className="pointer-events-none absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

                    <Link href="/" className="relative z-10 inline-flex items-center gap-2 text-white/95">
                        <Sparkles className="h-5 w-5" />
                        <span className="text-lg font-semibold">Project Aurora</span>
                    </Link>

                    <div className="relative z-10">
                        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Welcome Back</p>
                        <h1 className="max-w-lg text-5xl font-black leading-tight">
                            Launch websites, bookings, and services from one login.
                        </h1>
                        <p className="mt-6 max-w-lg text-base leading-relaxed text-white/85">
                            Continue building your website, manage booking flows, and run backend-powered services in one place.
                        </p>
                    </div>

                    <div className="relative z-10 inline-flex items-center gap-3 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90">
                        <ShieldCheck className="h-4 w-4" />
                        Secure tenant-scoped session authentication
                    </div>
                </section>

                <section className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
                    <div className="absolute right-5 top-5 z-20">
                        <ThemeToggle fullWidth={false} align="right" />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(80,72,229,0.12),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(80,72,229,0.08),transparent_45%)]" />
                    <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-8">
                            <Link href="/" className="inline-flex items-center gap-2 text-[#5048e5] lg:hidden">
                                <Sparkles className="h-5 w-5" />
                                <span className="text-base font-semibold">Project Aurora</span>
                            </Link>
                            <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">Sign in</h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                Access your dashboard and continue building your website.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:bg-slate-950 dark:text-slate-100 ${fieldErrors.email ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'}`}
                                    placeholder="you@example.com"
                                />
                                {fieldErrors.email && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => updateField('password', e.target.value)}
                                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:bg-slate-950 dark:text-slate-100 ${fieldErrors.password ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-700'}`}
                                    placeholder="Enter your password"
                                />
                                {fieldErrors.password && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end">
                                <Link href="/forgot-password" className="text-sm font-medium text-[#5048e5] hover:text-[#3e38b6]">
                                    Forgot your password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5048e5] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#5048e5]/25 transition hover:bg-[#433bcf] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? 'Signing in...' : 'Sign in'}
                                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="font-semibold text-[#5048e5] hover:text-[#3e38b6]">
                                Register for free
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
