'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/auth-context';
import { api } from '../../../lib/api-client';

export default function CreateInstancePage() {
    const router = useRouter();
    const { currentTenant, loadInstances } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        businessType: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Must have a tenant first
    if (!currentTenant) {
        router.push('/onboarding/create-organization');
        return null;
    }

    function updateField(field: string, value: string) {
        if (field === 'subdomain') {
            value = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        }
        setFormData((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (formData.subdomain.length < 3) {
            setError('Subdomain must be at least 3 characters');
            return;
        }

        setIsSubmitting(true);

        const res = await api.post('/cms/instances', {
            name: formData.name,
            subdomain: formData.subdomain,
            businessType: formData.businessType || undefined,
        });

        if (res.success) {
            await loadInstances();
            router.push('/dashboard');
        } else {
            setError(res.error?.message || 'Failed to create website');
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Create your first website
                        </h1>
                        <p className="text-gray-600 text-sm mt-1">
                            Set up a booking website for <span className="font-medium">{currentTenant.businessName}</span>
                        </p>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            <span className="text-green-600 font-medium">Organization</span>
                            <span className="flex-1 border-t border-gray-200" />
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">2</span>
                            <span className="font-medium text-blue-600">Website</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Website name
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                value={formData.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="My Booking Site"
                            />
                        </div>

                        <div>
                            <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-1">
                                Subdomain
                            </label>
                            <div className="flex items-center">
                                <input
                                    id="subdomain"
                                    type="text"
                                    required
                                    value={formData.subdomain}
                                    onChange={(e) => updateField('subdomain', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="my-site"
                                />
                                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">
                                    .yourdomain.com
                                </span>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
                                Business type <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                                id="businessType"
                                type="text"
                                value={formData.businessType}
                                onChange={(e) => updateField('businessType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Salon, Gym, Restaurant"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            {isSubmitting ? 'Creating...' : 'Create website & go to dashboard'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
