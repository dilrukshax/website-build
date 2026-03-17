'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api-client';

interface Instance {
    id: string;
    name: string;
    subdomain: string;
    businessType: string | null;
    status: string;
    createdAt: string;
}

export default function InstancesPage() {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadInstances();
    }, []);

    async function loadInstances() {
        const res = await api.get<Instance[]>('/cms/instances');
        if (res.success && res.data) {
            setInstances(res.data);
        }
        setIsLoading(false);
    }

    if (isLoading) {
        return <div className="text-gray-500">Loading instances...</div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Websites</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your booking websites</p>
                </div>
                <Link
                    href="/dashboard/instances/new"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                >
                    Create website
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Subdomain</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {instances.map((instance) => (
                            <tr key={instance.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                                            {instance.name.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="font-medium text-gray-900">{instance.name}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {instance.subdomain}.yourdomain.com
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {instance.businessType || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        instance.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {instance.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(instance.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {instances.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No websites yet. Create your first one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
