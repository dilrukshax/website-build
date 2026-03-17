"use client";

import { useState, useEffect } from "react";
import { api } from "../../../lib/api-client";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration: number;
  isActive: boolean;
  createdAt: string;
}

interface ServiceForm {
  name: string;
  description: string;
  price: string;
  currency: string;
  duration: string;
}

const EMPTY_FORM: ServiceForm = {
  name: "",
  description: "",
  price: "",
  currency: "USD",
  duration: "60",
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setIsLoading(true);
    const res = await api.get<Service[]>("/cms/services");
    if (res.success && res.data) {
      setServices(Array.isArray(res.data) ? res.data : (res.data as unknown as { items?: Service[] }).items || []);
    }
    setIsLoading(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(service: Service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || "",
      price: String(service.price),
      currency: service.currency,
      duration: String(service.duration),
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.duration) {
      setError("Name, price and duration are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      currency: form.currency,
      duration: parseInt(form.duration, 10),
      isActive: true,
    };
    const res = editingId
      ? await api.put(`/cms/services/${editingId}`, payload)
      : await api.post("/cms/services", payload);
    if (res.success) {
      setShowForm(false);
      loadServices();
    } else {
      setError((res as { error?: { message?: string } }).error?.message || "Failed to save service.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to deactivate this service?")) return;
    const res = await api.del(`/cms/services/${id}`);
    if (res.success) loadServices();
  }

  async function handleToggleActive(service: Service) {
    await api.put(`/cms/services/${service.id}`, { isActive: !service.isActive });
    loadServices();
  }

  if (isLoading) {
    return <div className="text-gray-500 p-6">Loading services...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the services available for booking on your website.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Service
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingId ? "Edit Service" : "Add New Service"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Haircut, Consultation, Yoga Class"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional description..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  placeholder="60"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">The end time is auto-calculated from this duration when a booking is made.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Service"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{service.name}</div>
                  {service.description && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">{service.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                  {Number(service.price).toFixed(2)} {service.currency}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {service.duration} min
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(service)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      service.isActive
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {service.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-6 py-4 text-right space-x-4">
                  <button
                    onClick={() => openEdit(service)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium transition-colors"
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="text-gray-300 mb-4">
                    <svg className="mx-auto h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No services yet</p>
                  <p className="text-sm text-gray-400 mt-1">Create your first service to allow customers to book appointments.</p>
                  <button
                    onClick={openCreate}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + Add First Service
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
