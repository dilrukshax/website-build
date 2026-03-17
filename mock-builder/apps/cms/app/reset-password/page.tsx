'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api-client';

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsSubmitting(true);

        const res = await api.post(
            '/auth/reset-password',
            { token, newPassword: password },
            { skipAuth: true },
        );

        if (res.success) {
            setSuccess(true);
        } else {
            setError(res.error?.message || 'Failed to reset password');
        }

        setIsSubmitting(false);
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid link</h1>
                        <p className="text-gray-600 mb-6">
                            This password reset link is invalid or has expired.
                        </p>
                        <Link
                            href="/forgot-password"
                            className="text-blue-600 hover:text-blue-500 font-medium"
                        >
                            Request a new link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="text-green-500 text-4xl mb-4">&#10003;</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Password reset</h1>
                        <p className="text-gray-600 mb-6">
                            Your password has been reset successfully.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
                        Set a new password
                    </h1>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                New password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Min 8 characters"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm new password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                required
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Re-enter password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            {isSubmitting ? 'Resetting...' : 'Reset password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
