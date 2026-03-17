'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../../lib/api-client';

interface Tenant {
    id: string;
    subdomain: string;
    businessName: string;
    businessType: string | null;
    status: string;
    createdAt: string;
    owner: {
        id: string;
        email: string;
        fullName: string;
    };
    staffCount: number;
}

export default function SuperAdminTenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTenants();
    }, []);

    async function loadTenants() {
        // Need to pass skipAuth: false to ensure we send standard tokens, 
        // but no special headers are needed as the backend relies on the token's isSuperAdmin flag.
        const res = await api.get<Tenant[]>('/cms/superadmin/tenants');
        if (res.success && res.data) {
            setTenants(res.data);
        }
        setIsLoading(false);
    }

    if (isLoading) {
        return <div className="text-gray-500">Loading all tenants...</div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Tenants (Super Admin)</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and view all platform tenants</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Subdomain</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tenants.map((tenant) => (
                            <tr key={tenant.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                                            {tenant.businessName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{tenant.businessName}</p>
                                            {tenant.businessType && (
                                                <p className="text-xs text-gray-500">{tenant.businessType}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {tenant.subdomain}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-gray-900">{tenant.owner.fullName}</p>
                                    <p className="text-xs text-gray-500">{tenant.owner.email}</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {tenant.staffCount}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        tenant.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {tenant.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium">
                                    <Link
                                        href={`/dashboard/superadmin/tenants/${tenant.id}`}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {tenants.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No tenants found in the system.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
