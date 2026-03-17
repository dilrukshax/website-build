'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/auth-context';

export default function CreateOrganizationPage() {
    const router = useRouter();
    const { createTenant, tenants } = useAuth();

    const [businessName, setBusinessName] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If user already has tenants, redirect to dashboard
    if (tenants.length > 0) {
        router.push('/dashboard');
        return null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (businessName.trim().length < 2) {
            setError('Organization name must be at least 2 characters');
            return;
        }

        setIsSubmitting(true);

        const result = await createTenant(businessName.trim());

        if (result.success) {
            router.push('/onboarding/create-instance');
        } else {
            setError(result.error || 'Failed to create organization');
        }

        setIsSubmitting(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Create your organization
                        </h1>
                        <p className="text-gray-600 text-sm mt-1">
                            This is your business or company name. You can create multiple websites within it.
                        </p>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">1</span>
                            <span className="font-medium text-blue-600">Organization</span>
                            <span className="flex-1 border-t border-gray-200" />
                            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-semibold">2</span>
                            <span className="text-gray-400">Website</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                                Organization name
                            </label>
                            <input
                                id="businessName"
                                type="text"
                                required
                                autoFocus
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="My Business Inc."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            {isSubmitting ? 'Creating...' : 'Continue'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
