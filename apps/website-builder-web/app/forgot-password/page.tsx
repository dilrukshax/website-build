'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api-client';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const res = await api.post('/auth/forgot-password', { email }, { skipAuth: true });

        if (res.success) {
            setSubmitted(true);
        } else {
            setError(res.error?.message || 'Something went wrong');
        }

        setIsSubmitting(false);
    }

    if (submitted) {
        return (
            <div className="legacy-theme min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="text-green-500 text-4xl mb-4">&#10003;</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
                        <p className="text-gray-600 mb-6">
                            If an account exists with that email, we&apos;ve sent a password reset link.
                        </p>
                        <Link
                            href="/login"
                            className="text-blue-600 hover:text-blue-500 font-medium"
                        >
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="legacy-theme min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                        Forgot your password?
                    </h1>
                    <p className="text-center text-gray-600 mb-6 text-sm">
                        Enter your email and we&apos;ll send you a reset link
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="you@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            {isSubmitting ? 'Sending...' : 'Send reset link'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Remember your password?{' '}
                        <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
