'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, X } from 'lucide-react';
import { DomainSupportContact } from '../../../components/domain-support-contact';
import { api } from '../../../lib/api-client';
import { getInstanceDisplayDomain } from '../../../lib/domain';
import { useAuth } from '../../../contexts/auth-context';
import {
    WEBSITE_SETUP_TIMEZONE_SUGGESTIONS,
    isValidCustomDomainHostname,
    isValidIanaTimezone,
    normalizeDomainHost,
} from '../../../lib/website-setup';

interface Instance {
    id: string;
    name: string;
    subdomain: string;
    fullDomain?: string | null;
    customDomain?: string | null;
    businessType: string | null;
    timezone: string;
    status: string;
    createdAt: string;
}

interface EditForm {
    name: string;
    businessType: string;
    timezone: string;
    domainMode: 'subdomain' | 'customDomain';
    customDomain: string;
}

type EditField = 'name' | 'businessType' | 'timezone' | 'customDomain';

export default function InstancesPage() {
    const { currentTenant, loadInstances: syncAuthInstances } = useAuth();
    const [instances, setInstances] = useState<Instance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [actionError, setActionError] = useState('');
    const [editingInstanceId, setEditingInstanceId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<EditForm | null>(null);
    const [editErrors, setEditErrors] = useState<Partial<Record<EditField, string>>>({});
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

    const instanceLimitReached = currentTenant?.usageSummary.instances.limit !== null
        && currentTenant !== null
        && currentTenant.usageSummary.instances.used >= (currentTenant.usageSummary.instances.limit || 0);

    useEffect(() => {
        void loadInstances();
    }, []);

    async function loadInstances(showLoading = true) {
        if (showLoading) {
            setIsLoading(true);
        }
        setPageError('');
        const res = await api.get<Instance[]>('/cms/instances', { omitInstanceHeader: true });
        if (res.success && res.data) {
            setInstances(res.data);
        } else {
            setPageError(res.error?.message || 'Failed to load websites');
        }
        if (showLoading) {
            setIsLoading(false);
        }
    }

    async function syncAfterMutation() {
        await Promise.all([
            loadInstances(false),
            syncAuthInstances(),
        ]);
    }

    function openEdit(instance: Instance) {
        setActionMessage('');
        setActionError('');
        setEditErrors({});
        setEditingInstanceId(instance.id);
        setEditForm({
            name: instance.name,
            businessType: instance.businessType || '',
            timezone: instance.timezone || 'UTC',
            domainMode: instance.customDomain ? 'customDomain' : 'subdomain',
            customDomain: instance.customDomain || '',
        });
    }

    function closeEdit() {
        if (isSavingEdit) return;
        setEditingInstanceId(null);
        setEditForm(null);
        setEditErrors({});
    }

    async function handleSaveEdit() {
        if (!editingInstanceId || !editForm) {
            return;
        }

        const currentInstance = instances.find((instance) => instance.id === editingInstanceId);
        if (!currentInstance) {
            setActionError('Website record was not found.');
            return;
        }

        setActionMessage('');
        setActionError('');
        setEditErrors({});

        const cleanedName = editForm.name.trim();
        const cleanedBusinessType = editForm.businessType.trim();
        const cleanedTimezone = editForm.timezone.trim();
        const cleanedCustomDomain = normalizeDomainHost(editForm.customDomain);

        const nextErrors: Partial<Record<EditField, string>> = {};
        if (!cleanedName) {
            nextErrors.name = 'Website name is required';
        }
        if (cleanedBusinessType.length > 255) {
            nextErrors.businessType = 'Industry must be 255 characters or fewer';
        }
        if (!cleanedTimezone) {
            nextErrors.timezone = 'Timezone is required';
        } else if (!isValidIanaTimezone(cleanedTimezone)) {
            nextErrors.timezone = 'Please enter a valid IANA timezone (for example: Asia/Colombo)';
        }
        if (editForm.domainMode === 'customDomain') {
            if (!cleanedCustomDomain) {
                nextErrors.customDomain = 'Custom domain is required';
            } else if (!isValidCustomDomainHostname(cleanedCustomDomain)) {
                nextErrors.customDomain = 'Enter a valid domain (example: example.com)';
            }
        }

        if (Object.keys(nextErrors).length > 0) {
            setEditErrors(nextErrors);
            return;
        }

        setIsSavingEdit(true);

        const updateRes = await api.put(`/cms/instances/${editingInstanceId}`, {
            name: cleanedName,
            businessType: cleanedBusinessType,
            timezone: cleanedTimezone,
        }, { omitInstanceHeader: true });

        if (!updateRes.success) {
            setActionError(updateRes.error?.message || 'Failed to update website');
            setIsSavingEdit(false);
            return;
        }

        const currentCustomDomain = normalizeDomainHost(currentInstance.customDomain || '');
        const wantsCustomDomain = editForm.domainMode === 'customDomain';
        let domainError = '';

        if (wantsCustomDomain && cleanedCustomDomain && cleanedCustomDomain !== currentCustomDomain) {
            const domainRouteRes = await api.put(`/cms/instances/${editingInstanceId}/domain-route`, {
                host: cleanedCustomDomain,
                active: true,
                isPrimary: true,
            }, { omitInstanceHeader: true });
            if (!domainRouteRes.success) {
                domainError = domainRouteRes.error?.message || 'Domain route update failed';
            }
        } else if (!wantsCustomDomain && currentCustomDomain) {
            const removeRouteRes = await api.del(`/cms/instances/${editingInstanceId}/domain-route/${encodeURIComponent(currentCustomDomain)}`, { omitInstanceHeader: true });
            if (!removeRouteRes.success) {
                domainError = removeRouteRes.error?.message || 'Failed to remove domain route';
            }
        }

        await syncAfterMutation();

        if (domainError) {
            setActionError(`Website details were updated, but domain change failed: ${domainError}`);
            setIsSavingEdit(false);
            return;
        }

        closeEdit();
        setActionMessage('Website updated successfully.');
        setIsSavingEdit(false);
    }

    async function handleDelete(instance: Instance) {
        if (isDeletingId || isSavingEdit) {
            return;
        }

        const confirmed = window.confirm(
            `Delete website "${instance.name}"? This permanently removes the website and all related data.`,
        );
        if (!confirmed) {
            return;
        }

        setActionMessage('');
        setActionError('');
        setIsDeletingId(instance.id);

        const res = await api.del(`/cms/instances/${instance.id}`, { omitInstanceHeader: true });
        if (!res.success) {
            setActionError(res.error?.message || 'Failed to delete website');
            setIsDeletingId(null);
            return;
        }

        if (editingInstanceId === instance.id) {
            closeEdit();
        }

        await syncAfterMutation();
        setActionMessage('Website deleted successfully.');
        setIsDeletingId(null);
    }

    function updateEditField(field: keyof EditForm, value: string) {
        if (!editForm) return;
        setEditForm((prev) => {
            if (!prev) return prev;
            if (field === 'customDomain') {
                return {
                    ...prev,
                    customDomain: value.toLowerCase().replace(/\s+/g, ''),
                };
            }
            return {
                ...prev,
                [field]: value,
            };
        });
        setActionError('');
        if (field === 'domainMode') {
            setEditErrors((prev) => ({ ...prev, customDomain: undefined }));
            return;
        }
        if (field === 'name' || field === 'businessType' || field === 'timezone' || field === 'customDomain') {
            setEditErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    }

    const editingInstance = editingInstanceId
        ? instances.find((instance) => instance.id === editingInstanceId) || null
        : null;

    if (isLoading) {
        return <div className="legacy-theme text-gray-500">Loading instances...</div>;
    }

    return (
        <div className="legacy-theme">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Websites</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your booking websites</p>
                </div>
                <Link
                    href="/dashboard/instances/new"
                    className={`px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors ${
                        instanceLimitReached
                            ? 'pointer-events-none bg-slate-300 text-slate-600'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {instanceLimitReached ? 'Instance limit reached' : 'Create website'}
                </Link>
            </div>

            {pageError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {pageError}
                </div>
            )}

            {actionError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {actionError}
                </div>
            )}

            {actionMessage && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {actionMessage}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Timezone</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                                    <p>{instance.customDomain || getInstanceDisplayDomain(instance)}</p>
                                    {instance.customDomain && (
                                        <p className="mt-1 text-xs text-slate-500">Platform: {getInstanceDisplayDomain(instance)}</p>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{instance.businessType || '-'}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{instance.timezone || 'UTC'}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        instance.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {instance.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(instance.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="inline-flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(instance)}
                                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void handleDelete(instance)}
                                            disabled={isDeletingId === instance.id}
                                            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {isDeletingId === instance.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {instances.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No websites yet. Create your first one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editingInstance && editForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
                    <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Edit website</h2>
                                <p className="text-xs text-slate-500">Update website details and domain configuration.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeEdit}
                                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100"
                                aria-label="Close edit dialog"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4 px-5 py-4">
                            <div>
                                <label htmlFor="instanceName" className="mb-1 block text-sm font-medium text-slate-700">
                                    Website name
                                </label>
                                <input
                                    id="instanceName"
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => updateEditField('name', e.target.value)}
                                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 ${
                                        editErrors.name ? 'border-red-300' : 'border-slate-300'
                                    }`}
                                />
                                {editErrors.name && <p className="mt-1 text-xs text-red-600">{editErrors.name}</p>}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="instanceBusinessType" className="mb-1 block text-sm font-medium text-slate-700">
                                        Industry (optional)
                                    </label>
                                    <input
                                        id="instanceBusinessType"
                                        type="text"
                                        value={editForm.businessType}
                                        onChange={(e) => updateEditField('businessType', e.target.value)}
                                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 ${
                                            editErrors.businessType ? 'border-red-300' : 'border-slate-300'
                                        }`}
                                    />
                                    {editErrors.businessType && <p className="mt-1 text-xs text-red-600">{editErrors.businessType}</p>}
                                </div>

                                <div>
                                    <label htmlFor="instanceTimezone" className="mb-1 block text-sm font-medium text-slate-700">
                                        Timezone
                                    </label>
                                    <input
                                        id="instanceTimezone"
                                        type="text"
                                        list="instance-timezone-suggestions"
                                        value={editForm.timezone}
                                        onChange={(e) => updateEditField('timezone', e.target.value)}
                                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 ${
                                            editErrors.timezone ? 'border-red-300' : 'border-slate-300'
                                        }`}
                                    />
                                    <datalist id="instance-timezone-suggestions">
                                        {WEBSITE_SETUP_TIMEZONE_SUGGESTIONS.map((timezone) => (
                                            <option key={timezone} value={timezone} />
                                        ))}
                                    </datalist>
                                    {editErrors.timezone && <p className="mt-1 text-xs text-red-600">{editErrors.timezone}</p>}
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Internal subdomain</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">{editingInstance.subdomain}</p>
                                <p className="mt-1 text-xs text-slate-500">Subdomain cannot be changed after website creation.</p>
                            </div>

                            <div>
                                <p className="mb-2 text-sm font-medium text-slate-700">Domain mode</p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <label className={`flex cursor-pointer gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                        editForm.domainMode === 'subdomain'
                                            ? 'border-[#5048e5] bg-[#5048e5]/10 text-[#5048e5]'
                                            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="editDomainMode"
                                            value="subdomain"
                                            checked={editForm.domainMode === 'subdomain'}
                                            onChange={() => updateEditField('domainMode', 'subdomain')}
                                            className="mt-0.5 h-4 w-4 border-slate-300 text-[#5048e5] focus:ring-[#5048e5]"
                                        />
                                        <span>
                                            <p className="font-semibold">Subdomain only</p>
                                            <p className="text-xs text-slate-500">Use platform-hosted domain</p>
                                        </span>
                                    </label>

                                    <label className={`flex cursor-pointer gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                        editForm.domainMode === 'customDomain'
                                            ? 'border-[#5048e5] bg-[#5048e5]/10 text-[#5048e5]'
                                            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="editDomainMode"
                                            value="customDomain"
                                            checked={editForm.domainMode === 'customDomain'}
                                            onChange={() => updateEditField('domainMode', 'customDomain')}
                                            className="mt-0.5 h-4 w-4 border-slate-300 text-[#5048e5] focus:ring-[#5048e5]"
                                        />
                                        <span>
                                            <p className="font-semibold">Custom domain</p>
                                            <p className="text-xs text-slate-500">Connect your own domain</p>
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {editForm.domainMode === 'customDomain' && (
                                <div>
                                    <label htmlFor="instanceCustomDomain" className="mb-1 block text-sm font-medium text-slate-700">
                                        Custom domain
                                    </label>
                                    <input
                                        id="instanceCustomDomain"
                                        type="text"
                                        value={editForm.customDomain}
                                        onChange={(e) => updateEditField('customDomain', e.target.value)}
                                        placeholder="example.com"
                                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 ${
                                            editErrors.customDomain ? 'border-red-300' : 'border-slate-300'
                                        }`}
                                    />
                                    <p className="mt-1 text-xs text-slate-500">Enter hostname only (no protocol, no path).</p>
                                    <p className="mt-1 text-xs text-slate-500">Domain DNS/TLS is managed manually outside platform.</p>
                                    <DomainSupportContact
                                        domain={editForm.customDomain}
                                        className="mt-2"
                                    />
                                    {editErrors.customDomain && <p className="mt-1 text-xs text-red-600">{editErrors.customDomain}</p>}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
                            <button
                                type="button"
                                onClick={closeEdit}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleSaveEdit()}
                                disabled={isSavingEdit}
                                className="rounded-lg bg-[#5048e5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#433bcf] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSavingEdit ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
