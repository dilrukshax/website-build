'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    function updateField(field: string, value: string) {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        const errors: Record<string, string> = {};
        if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsSubmitting(true);

        const result = await register({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
        });

        if (result.success) {
            router.push('/onboarding/create-organization');
        } else {
            setError(result.error || 'Registration failed');
        }

        setIsSubmitting(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                        Create your account
                    </h1>
                    <p className="text-center text-gray-600 mb-6 text-sm">
                        Start managing your bookings in minutes
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                Full name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={(e) => updateField('fullName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                value={formData.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={(e) => updateField('password', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.password ? 'border-red-300' : 'border-gray-300'}`}
                                    placeholder="Min 8 characters"
                                />
                                {fieldErrors.password && (
                                    <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                                    placeholder="Re-enter password"
                                />
                                {fieldErrors.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            {isSubmitting ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
