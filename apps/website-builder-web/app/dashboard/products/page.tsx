"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api-client";
import { uploadCmsImage } from "../../../lib/media-upload";

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface ProductForm {
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  currency: string;
}

const EMPTY_FORM: ProductForm = {
  name: "",
  description: "",
  imageUrl: "",
  price: "",
  currency: "USD",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    setIsLoading(true);
    const res = await api.get<Product[]>("/cms/products");
    if (res.success && res.data) {
      setProducts(Array.isArray(res.data) ? res.data : (res.data as unknown as { items?: Product[] }).items || []);
    }
    setIsLoading(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      price: String(product.price),
      currency: product.currency,
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.price) {
      setError("Name and price are required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      price: parseFloat(form.price),
      currency: form.currency,
      isActive: true,
    };

    const res = editingId
      ? await api.put(`/cms/products/${editingId}`, payload)
      : await api.post("/cms/products", payload);

    if (res.success) {
      setShowForm(false);
      void loadProducts();
    } else {
      setError((res as { error?: { message?: string } }).error?.message || "Failed to save product.");
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to deactivate this product?")) return;
    const res = await api.del(`/cms/products/${id}`);
    if (res.success) {
      void loadProducts();
    }
  }

  async function handleToggleActive(product: Product) {
    await api.put(`/cms/products/${product.id}`, { isActive: !product.isActive });
    void loadProducts();
  }

  async function handleReorder(productId: string, direction: "up" | "down") {
    const currentIndex = products.findIndex((product) => product.id === productId);
    if (currentIndex < 0) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    const previousProducts = [...products];
    const reordered = [...products];
    const current = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex]!;
    reordered[targetIndex] = current!;

    const optimistic = reordered.map((product, index) => ({
      ...product,
      sortOrder: index,
    }));

    setProducts(optimistic);
    setReorderingId(productId);

    const payload = optimistic.map((product, index) => ({
      id: product.id,
      sortOrder: index,
    }));

    const res = await api.put("/cms/products/reorder", { products: payload });
    if (!res.success) {
      setProducts(previousProducts);
      alert(res.error?.message || "Failed to reorder products.");
    }

    setReorderingId(null);
  }

  async function handleImageFileChange(file: File | null) {
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    try {
      const publicUrl = await uploadCmsImage(file);
      setForm((current) => ({ ...current, imageUrl: publicUrl }));
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Image upload failed.";
      setError(message);
    } finally {
      setUploadingImage(false);
    }
  }

  if (isLoading) {
    return <div className="legacy-theme p-6 text-gray-500">Loading products...</div>;
  }

  return (
    <div className="legacy-theme w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product catalog for website product sections.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Argan Hair Serum"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional product description..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Product Image</label>
                {form.imageUrl && (
                  <div className="mb-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img src={form.imageUrl} alt="Product preview" className="h-36 w-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <label className={`inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 ${uploadingImage ? "pointer-events-none opacity-60" : ""}`}>
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        void handleImageFileChange(file);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, imageUrl: "" }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="Or paste image URL"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="LKR">LKR (Rs)</option>
                    <option value="INR">INR (Rs)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving || uploadingImage}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-left">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Order</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Product</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Price</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product, index) => (
                <tr key={product.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-xs font-semibold text-gray-500">{index + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => void handleReorder(product.id, "up")}
                          disabled={index === 0 || reorderingId === product.id}
                          className="h-7 w-7 rounded border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Move ${product.name} up`}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => void handleReorder(product.id, "down")}
                          disabled={index === products.length - 1 || reorderingId === product.id}
                          className="h-7 w-7 rounded border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Move ${product.name} down`}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase text-gray-400">No image</div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="max-w-xs truncate text-sm text-gray-500">{product.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-700">
                    {Number(product.price).toFixed(2)} {product.currency}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => void handleToggleActive(product)}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        product.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => openEdit(product)}
                      className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void handleDelete(product.id)}
                      className="text-sm font-medium text-red-600 transition-colors hover:text-red-900"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="mb-4 text-gray-300">
                      <svg className="mx-auto h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V7a2 2 0 00-2-2h-4l-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h8" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 17h6m-3-3v6" />
                      </svg>
                    </div>
                    <p className="font-medium text-gray-500">No products yet</p>
                    <p className="mt-1 text-sm text-gray-400">Create your first product to showcase in product sections.</p>
                    <button
                      onClick={openCreate}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      + Add First Product
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
