'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { api } from '../../../lib/api-client';

interface Permission {
    id: string;
    key: string;
    name: string;
    module: string;
}

interface Role {
    id: string;
    name: string;
    description: string | null;
    isSystemRole: boolean;
    permissions: Permission[];
    userCount: number;
    createdAt: string;
}

export default function RolesPage() {
    const { currentTenant, hasPermission } = useAuth();
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const loadData = useCallback(async () => {
        if (!currentTenant) return;

        const [rolesRes, permsRes] = await Promise.all([
            api.get<Role[]>('/cms/roles'),
            api.get<Record<string, Permission[]>>('/cms/permissions'),
        ]);

        if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data);
        if (permsRes.success && permsRes.data) setAllPermissions(permsRes.data);
        setIsLoading(false);
    }, [currentTenant]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (isLoading) return <div className="legacy-theme text-gray-500">Loading roles...</div>;

    return (
        <div className="legacy-theme">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage roles for {currentTenant?.businessName}</p>
                </div>
                {hasPermission('roles.create') && (
                    <button
                        onClick={() => { setShowCreateForm(true); setEditingRole(null); }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                    >
                        Create role
                    </button>
                )}
            </div>

            {(showCreateForm || editingRole) && (
                <RoleForm
                    role={editingRole}
                    allPermissions={allPermissions}
                    onSave={() => { setShowCreateForm(false); setEditingRole(null); loadData(); }}
                    onCancel={() => { setShowCreateForm(false); setEditingRole(null); }}
                />
            )}

            <div className="space-y-4">
                {roles.map((role) => (
                    <div key={role.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">{role.name}</h3>
                                    {role.isSystemRole && (
                                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">System</span>
                                    )}
                                </div>
                                {role.description && (
                                    <p className="text-sm text-gray-500 mt-0.5">{role.description}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">{role.userCount} user{role.userCount !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="flex gap-2">
                                {hasPermission('roles.update') && (
                                    <button
                                        onClick={() => { setEditingRole(role); setShowCreateForm(false); }}
                                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Edit
                                    </button>
                                )}
                                {hasPermission('roles.delete') && !role.isSystemRole && role.userCount === 0 && (
                                    <DeleteRoleButton roleId={role.id} onDeleted={loadData} />
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {role.permissions.map((perm) => (
                                <span key={perm.id} className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded">
                                    {perm.key}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RoleForm({
    role,
    allPermissions,
    onSave,
    onCancel,
}: {
    role: Role | null;
    allPermissions: Record<string, Permission[]>;
    onSave: () => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(role?.name || '');
    const [description, setDescription] = useState(role?.description || '');
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
        new Set(role?.permissions.map((p) => p.id) || []),
    );
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    function togglePermission(id: string) {
        setSelectedPermissions((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleModule(permissions: Permission[]) {
        const allSelected = permissions.every((p) => selectedPermissions.has(p.id));
        setSelectedPermissions((prev) => {
            const next = new Set(prev);
            permissions.forEach((p) => {
                if (allSelected) next.delete(p.id);
                else next.add(p.id);
            });
            return next;
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (selectedPermissions.size === 0) {
            setError('Select at least one permission');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            name,
            description: description || undefined,
            permissionIds: Array.from(selectedPermissions),
        };

        const res = role
            ? await api.put(`/cms/roles/${role.id}`, payload)
            : await api.post('/cms/roles', payload);

        if (res.success) {
            onSave();
        } else {
            setError(res.error?.message || 'Failed to save role');
        }

        setIsSubmitting(false);
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
                {role ? 'Edit Role' : 'Create New Role'}
            </h3>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        id="roleName"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={role?.isSystemRole}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
                        placeholder="Role name"
                    />
                </div>
                <div>
                    <label htmlFor="roleDesc" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                        id="roleDesc"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Optional description"
                    />
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Permissions</p>
                <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {Object.entries(allPermissions).map(([module, perms]) => (
                        <div key={module}>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={perms.every((p) => selectedPermissions.has(p.id))}
                                    onChange={() => toggleModule(perms)}
                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm font-medium text-gray-800 capitalize">{module}</span>
                            </label>
                            <div className="ml-6 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                {perms.map((perm) => (
                                    <label key={perm.id} className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedPermissions.has(perm.id)}
                                            onChange={() => togglePermission(perm.id)}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-xs text-gray-600">{perm.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-md shadow-sm transition-colors"
                >
                    {isSubmitting ? 'Saving...' : role ? 'Update role' : 'Create role'}
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

function DeleteRoleButton({ roleId, onDeleted }: { roleId: string; onDeleted: () => void }) {
    const [confirming, setConfirming] = useState(false);

    async function handleDelete() {
        const res = await api.del(`/cms/roles/${roleId}`);
        if (res.success) onDeleted();
    }

    if (confirming) {
        return (
            <div className="flex gap-1">
                <button onClick={handleDelete} className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded">
                    Confirm
                </button>
                <button onClick={() => setConfirming(false)} className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-md hover:bg-red-50"
        >
            Delete
        </button>
    );
}
