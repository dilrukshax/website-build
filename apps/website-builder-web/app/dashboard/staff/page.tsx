'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { api } from '../../../lib/api-client';

interface StaffMember {
    id: string;
    userId: string;
    email: string;
    fullName: string;
    userStatus: string;
    role: { id: string; name: string };
    isOwner: boolean;
    status: string;
    createdAt: string;
}

interface Role {
    id: string;
    name: string;
}

export default function StaffPage() {
    const { currentTenant, hasPermission } = useAuth();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const staffCreationAllowed = currentTenant?.usageSummary.staffAccounts.allowed ?? false;

    const loadData = useCallback(async () => {
        if (!currentTenant) return;

        const [staffRes, rolesRes] = await Promise.all([
            api.get<StaffMember[]>('/cms/staff'),
            api.get<Array<{ id: string; name: string }>>('/cms/roles'),
        ]);

        if (staffRes.success && staffRes.data) {
            setStaff(staffRes.data);
            if (staffRes.meta) setMeta(staffRes.meta);
        }
        if (rolesRes.success && rolesRes.data) {
            setRoles(rolesRes.data.map((r) => ({ id: r.id, name: r.name })));
        }
        setIsLoading(false);
    }, [currentTenant]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (isLoading) return <div className="legacy-theme text-gray-500">Loading staff...</div>;

    return (
        <div className="legacy-theme">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {meta.total} member{meta.total !== 1 ? 's' : ''} in {currentTenant?.businessName}
                    </p>
                    {!staffCreationAllowed && (
                        <p className="text-xs text-amber-600 mt-1">
                            Staff accounts are unavailable on the current plan.
                        </p>
                    )}
                </div>
                {hasPermission('staff.create') && staffCreationAllowed && (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                    >
                        Add staff member
                    </button>
                )}
            </div>

            {showCreateForm && (
                <CreateStaffForm
                    roles={roles}
                    onCreated={() => { setShowCreateForm(false); loadData(); }}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {staff.map((member) => (
                            <StaffRow
                                key={member.id}
                                member={member}
                                roles={roles}
                                canUpdate={hasPermission('staff.update')}
                                canDelete={hasPermission('staff.delete')}
                                onUpdated={loadData}
                            />
                        ))}
                        {staff.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No staff members yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CreateStaffForm({
    roles,
    onCreated,
    onCancel,
}: {
    roles: Role[];
    onCreated: () => void;
    onCancel: () => void;
}) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        roleId: roles[0]?.id || '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const res = await api.post('/cms/staff', formData);

        if (res.success) {
            onCreated();
        } else {
            setError(res.error?.message || 'Failed to create staff member');
        }

        setIsSubmitting(false);
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add Staff Member</h3>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="staffName" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                    <input
                        id="staffName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Jane Smith"
                    />
                </div>
                <div>
                    <label htmlFor="staffEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        id="staffEmail"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="jane@example.com"
                    />
                </div>
                <div>
                    <label htmlFor="staffPassword" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                        id="staffPassword"
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Min 8 characters"
                    />
                </div>
                <div>
                    <label htmlFor="staffRole" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                        id="staffRole"
                        value={formData.roleId}
                        onChange={(e) => setFormData((p) => ({ ...p, roleId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md shadow-sm transition-colors"
                >
                    {isSubmitting ? 'Adding...' : 'Add member'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

function StaffRow({
    member,
    roles,
    canUpdate,
    canDelete,
    onUpdated,
}: {
    member: StaffMember;
    roles: Role[];
    canUpdate: boolean;
    canDelete: boolean;
    onUpdated: () => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState(member.role.id);
    const [isSaving, setIsSaving] = useState(false);

    async function handleRoleChange() {
        if (selectedRoleId === member.role.id) {
            setIsEditing(false);
            return;
        }
        setIsSaving(true);
        const res = await api.put(`/cms/staff/${member.id}`, { roleId: selectedRoleId });
        if (res.success) {
            onUpdated();
        }
        setIsSaving(false);
        setIsEditing(false);
    }

    async function handleRemove() {
        if (!confirm(`Remove ${member.fullName} from this instance?`)) return;
        const res = await api.del(`/cms/staff/${member.id}`);
        if (res.success) onUpdated();
    }

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                        {member.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">
                            {member.fullName}
                            {member.isOwner && (
                                <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Owner</span>
                            )}
                        </p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {roles.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleRoleChange}
                            disabled={isSaving}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <span className="text-sm text-gray-700">{member.role.name}</span>
                )}
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    member.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    {member.status}
                </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(member.createdAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 text-right">
                {!member.isOwner && (
                    <div className="flex justify-end gap-2">
                        {canUpdate && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Change role
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleRemove}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-50"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                )}
            </td>
        </tr>
    );
}
