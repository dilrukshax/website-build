"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../../lib/api-client";

interface ServiceDetails {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceForm {
  name: string;
  description: string;
  price: string;
  currency: string;
  duration: string;
}

export default function ServiceDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const serviceId = params.id;
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>({
    name: "",
    description: "",
    price: "",
    currency: "USD",
    duration: "60",
  });

  useEffect(() => {
    loadService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  async function loadService() {
    setIsLoading(true);
    setError(null);
    const res = await api.get<ServiceDetails>(`/cms/services/${serviceId}`);
    if (res.success && res.data) {
      setService(res.data);
      setForm({
        name: res.data.name,
        description: res.data.description || "",
        price: String(res.data.price),
        currency: res.data.currency,
        duration: String(res.data.duration),
      });
    } else {
      setError(res.error?.message || "Failed to load service details.");
    }
    setIsLoading(false);
  }

  async function handleSave() {
    if (!service) return;
    if (!form.name || !form.price || !form.duration) {
      setError("Name, price and duration are required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      currency: form.currency,
      duration: parseInt(form.duration, 10),
    };

    const res = await api.put(`/cms/services/${service.id}`, payload);
    if (res.success) {
      await loadService();
    } else {
      setError(res.error?.message || "Failed to save service changes.");
    }

    setIsSaving(false);
  }

  async function handleToggleActive() {
    if (!service) return;
    setIsSaving(true);
    const res = await api.put(`/cms/services/${service.id}`, {
      isActive: !service.isActive,
    });
    if (res.success) {
      await loadService();
    } else {
      setError(res.error?.message || "Failed to update service status.");
    }
    setIsSaving(false);
  }

  if (isLoading) {
    return <div className="legacy-theme text-gray-500">Loading service details...</div>;
  }

  if (error && !service) {
    return (
      <div className="legacy-theme space-y-4">
        <Link
          href="/dashboard/services"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to services
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          {error}
        </div>
      </div>
    );
  }

  if (!service) {
    return <div className="legacy-theme text-gray-500">Service not found.</div>;
  }

  return (
    <div className="legacy-theme w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/services"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mt-1"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Service ID: {service.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            service.isActive
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          {service.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="LKR">LKR (₨)</option>
                <option value="INR">INR (₹)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleToggleActive}
                disabled={isSaving}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 ${
                  service.isActive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {service.isActive ? "Deactivate Service" : "Activate Service"}
              </button>
              <button
                onClick={loadService}
                disabled={isSaving}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Created</p>
                <p className="font-medium text-gray-900">
                  {new Date(service.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Last Updated</p>
                <p className="font-medium text-gray-900">
                  {new Date(service.updatedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Service ID</p>
                <p className="font-mono text-gray-900 break-all">{service.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
