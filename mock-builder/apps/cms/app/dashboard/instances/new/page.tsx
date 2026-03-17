'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api-client';
import { useAuth } from '../../../../contexts/auth-context';

export default function NewInstancePage() {
    const router = useRouter();
    const { loadInstances } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        businessType: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            router.push('/dashboard/instances');
        } else {
            setError(res.error?.message || 'Failed to create website');
        }

        setIsSubmitting(false);
    }

    return (
        <div className="max-w-lg">
            <div className="mb-6">
                <Link href="/dashboard/instances" className="text-sm text-gray-500 hover:text-gray-700">
                    &larr; Back to websites
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 mt-2">Create new website</h1>
                <p className="text-sm text-gray-500 mt-1">Set up a new booking website</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Website name
                    </label>
                    <input
                        id="name"
                        type="text"
                        required
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

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md shadow-sm transition-colors"
                    >
                        {isSubmitting ? 'Creating...' : 'Create website'}
                    </button>
                    <Link
                        href="/dashboard/instances"
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
