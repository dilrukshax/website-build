'use client';

import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';

export default function DashboardPage() {
    const { user, currentTenant, currentInstance, tenants, instances } = useAuth();

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Welcome back, {user?.fullName?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-gray-500 mb-8">
                {currentTenant
                    ? `Managing ${currentTenant.businessName}`
                    : 'Select an organization to get started'}
            </p>

            {currentTenant && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm font-medium text-gray-500">Current Website</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                            {currentInstance?.name || 'No website selected'}
                        </p>
                        {currentInstance && (
                            <p className="mt-1 text-sm text-gray-400">{currentInstance.subdomain}.yourdomain.com</p>
                        )}
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm font-medium text-gray-500">Your Role</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{currentTenant.role}</p>
                        <p className="mt-1 text-sm text-gray-400">
                            {currentTenant.isOwner ? 'Full access' : `${currentTenant.permissions.length} permissions`}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm font-medium text-gray-500">Websites</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{instances.length}</p>
                        <p className="mt-1 text-sm text-gray-400">
                            in {tenants.length} {tenants.length === 1 ? 'organization' : 'organizations'}
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Link
                        href="/dashboard/builder"
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:border-blue-400 transition-colors text-center"
                    >
                        <span className="text-2xl">&#127912;</span>
                        <span className="text-sm font-medium text-blue-700">Build Website</span>
                    </Link>
                    <Link
                        href="/dashboard/bookings"
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                    >
                        <span className="text-2xl">&#128197;</span>
                        <span className="text-sm font-medium text-gray-700">Bookings</span>
                    </Link>
                    <Link
                        href="/dashboard/customers"
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                    >
                        <span className="text-2xl">&#128101;</span>
                        <span className="text-sm font-medium text-gray-700">Customers</span>
                    </Link>
                    <Link
                        href="/dashboard/instances"
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                    >
                        <span className="text-2xl">&#127970;</span>
                        <span className="text-sm font-medium text-gray-700">Websites</span>
                    </Link>
                    <Link
                        href="/dashboard/staff"
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                    >
                        <span className="text-2xl">&#128100;</span>
                        <span className="text-sm font-medium text-gray-700">Staff</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
