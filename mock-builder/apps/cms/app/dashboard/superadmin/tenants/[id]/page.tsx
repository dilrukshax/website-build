'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../../../lib/api-client';
import { ArrowLeft, Briefcase, UserCog, ShieldAlert, ShieldCheck, Loader2, Globe } from 'lucide-react';

interface InstanceInfo {
    id: string;
    name: string;
    subdomain: string;
    businessType: string | null;
    status: string;
    createdAt: string;
}

interface TenantDetail {
    id: string;
    businessName: string;
    status: string;
    plan: string;
    createdAt: string;
    owner: {
        id: string;
        email: string;
        fullName: string;
        status: string;
        createdAt: string;
    };
    instances: InstanceInfo[];
    stats: {
        usersCount: number;
        instancesCount: number;
    };
}

interface StaffMember {
    id: string;
    userId: string;
    email: string;
    fullName: string;
    userStatus: string;
    userTenantStatus: string;
    isOwner: boolean;
    role: {
        id: string;
        name: string;
        isSystemRole: boolean;
    };
    joinedAt: string;
}

export default function SuperAdminTenantDetailsPage({
    params,
}: {
    params: { id: string };
}) {
    const tenantId = params.id;
    const [tenant, setTenant] = useState<TenantDetail | null>(null);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

    useEffect(() => {
        loadTenantDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenantId]);

    async function loadTenantDetails() {
        try {
            const [tenantRes, staffRes] = await Promise.all([
                api.get<TenantDetail>(`/cms/superadmin/tenants/${tenantId}`),
                api.get<StaffMember[]>(`/cms/superadmin/tenants/${tenantId}/staff`)
            ]);

            if (tenantRes.success && tenantRes.data) {
                setTenant(tenantRes.data);
            } else {
                setError(tenantRes.error?.message || 'Failed to load tenant details');
            }

            if (staffRes.success && staffRes.data) {
                setStaff(staffRes.data);
            }
        } catch (_err) {
            setError('An unexpected error occurred while loading data.');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleToggleStatus() {
        if (!tenant) return;

        setIsTogglingStatus(true);
        const newStatus = tenant.status === 'active' ? 'suspended' : 'active';

        try {
            const res = await api.put<{ id: string, status: string }>(`/cms/superadmin/tenants/${tenantId}/status`, {
                status: newStatus
            });

            if (res.success && res.data) {
                setTenant(prev => prev ? { ...prev, status: res.data!.status } : null);
            } else {
                alert(res.error?.message || 'Failed to update tenant status');
            }
        } catch (_err) {
            alert('An unexpected error occurred while updating status.');
        } finally {
            setIsTogglingStatus(false);
        }
    }

    if (isLoading) {
        return <div className="text-gray-500">Loading tenant details...</div>;
    }

    if (error || !tenant) {
        return <div className="text-red-500">{error || 'Tenant not found'}</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/dashboard/superadmin/tenants"
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{tenant.businessName}</h1>
                    <p className="text-sm text-gray-500 mt-1">Tenant Details</p>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tenant.status === 'active' ? 'bg-green-100 text-green-800'
                        : tenant.status === 'suspended' ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                        {tenant.status.toUpperCase()}
                    </span>

                    <button
                        onClick={handleToggleStatus}
                        disabled={isTogglingStatus}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                            tenant.status === 'active'
                                ? 'border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100'
                                : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isTogglingStatus ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : tenant.status === 'active' ? (
                            <ShieldAlert size={16} />
                        ) : (
                            <ShieldCheck size={16} />
                        )}
                        {tenant.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        <UserCog size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Staff Members</p>
                        <p className="text-2xl font-bold text-gray-900">{tenant.stats.usersCount}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Globe size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Websites</p>
                        <p className="text-2xl font-bold text-gray-900">{tenant.stats.instancesCount}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Plan</p>
                        <p className="text-2xl font-bold text-gray-900 capitalize">{tenant.plan}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Organization Details</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Tenant ID</p>
                            <p className="text-sm font-medium text-gray-900 font-mono">{tenant.id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Plan</p>
                            <p className="text-sm font-medium text-gray-900 capitalize">{tenant.plan}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Created At</p>
                            <p className="text-sm font-medium text-gray-900">{new Date(tenant.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Owner Details</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Owner ID</p>
                            <p className="text-sm font-medium text-gray-900 font-mono">{tenant.owner.id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Full Name</p>
                            <p className="text-sm font-medium text-gray-900">{tenant.owner.fullName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Email</p>
                            <a href={`mailto:${tenant.owner.email}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                {tenant.owner.email}
                            </a>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">User Status</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                tenant.owner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {tenant.owner.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Registered At</p>
                            <p className="text-sm font-medium text-gray-900">{new Date(tenant.owner.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Instances */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Websites (Instances)</h2>
                    <span className="bg-gray-100 text-gray-600 text-xs py-1 px-3 rounded-full font-medium">
                        {tenant.instances?.length || 0} Total
                    </span>
                </div>

                {!tenant.instances || tenant.instances.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No websites found for this tenant.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Subdomain</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {tenant.instances.map((instance) => (
                                    <tr key={instance.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{instance.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{instance.subdomain}.yourdomain.com</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{instance.businessType || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                instance.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {instance.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(instance.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Staff */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
                    <span className="bg-gray-100 text-gray-600 text-xs py-1 px-3 rounded-full font-medium">
                        {staff.length} Total
                    </span>
                </div>

                {staff.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No staff members found for this tenant.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">System Status</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tenant Status</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {staff.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                    {member.fullName}
                                                    {member.isOwner && (
                                                        <span className="bg-blue-100 text-blue-800 text-[10px] uppercase px-1.5 py-0.5 rounded font-bold">Owner</span>
                                                    )}
                                                </span>
                                                <span className="text-sm text-gray-500">{member.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-700 font-medium">
                                                {member.role.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                member.userStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {member.userStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                member.userTenantStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {member.userTenantStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(member.joinedAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
