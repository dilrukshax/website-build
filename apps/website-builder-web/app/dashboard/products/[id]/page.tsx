"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../../lib/api-client";
import { uploadCmsImage } from "../../../../lib/media-upload";

interface ProductDetails {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductForm {
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  currency: string;
}

export default function ProductDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const productId = params.id;
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({
    name: "",
    description: "",
    imageUrl: "",
    price: "",
    currency: "USD",
  });

  useEffect(() => {
    void loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function loadProduct() {
    setIsLoading(true);
    setError(null);
    const res = await api.get<ProductDetails>(`/cms/products/${productId}`);
    if (res.success && res.data) {
      setProduct(res.data);
      setForm({
        name: res.data.name,
        description: res.data.description || "",
        imageUrl: res.data.imageUrl || "",
        price: String(res.data.price),
        currency: res.data.currency,
      });
    } else {
      setError(res.error?.message || "Failed to load product details.");
    }
    setIsLoading(false);
  }

  async function handleSave() {
    if (!product) return;
    if (!form.name || !form.price) {
      setError("Name and price are required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      price: parseFloat(form.price),
      currency: form.currency,
    };

    const res = await api.put(`/cms/products/${product.id}`, payload);
    if (res.success) {
      await loadProduct();
    } else {
      setError(res.error?.message || "Failed to save product changes.");
    }

    setIsSaving(false);
  }

  async function handleToggleActive() {
    if (!product) return;
    setIsSaving(true);

    const res = await api.put(`/cms/products/${product.id}`, {
      isActive: !product.isActive,
    });

    if (res.success) {
      await loadProduct();
    } else {
      setError(res.error?.message || "Failed to update product status.");
    }

    setIsSaving(false);
  }

  async function handleImageFileChange(file: File | null) {
    if (!file) return;

    setIsUploadingImage(true);
    setError(null);

    try {
      const publicUrl = await uploadCmsImage(file);
      setForm((current) => ({ ...current, imageUrl: publicUrl }));
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Image upload failed.";
      setError(message);
    } finally {
      setIsUploadingImage(false);
    }
  }

  if (isLoading) {
    return <div className="legacy-theme text-gray-500">Loading product details...</div>;
  }

  if (error && !product) {
    return (
      <div className="legacy-theme space-y-4">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to products
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="legacy-theme text-gray-500">Product not found.</div>;
  }

  return (
    <div className="legacy-theme w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/products"
            className="mt-1 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Product ID: {product.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
            product.isActive
              ? "border-green-200 bg-green-100 text-green-800"
              : "border-gray-200 bg-gray-100 text-gray-600"
          }`}
        >
          {product.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Product Details</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Product Image</label>
              <div className="mb-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt={form.name || "Product preview"} className="h-56 w-full object-cover" />
                ) : (
                  <div className="flex h-56 items-center justify-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                    No image selected
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className={`inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 ${isUploadingImage ? "pointer-events-none opacity-60" : ""}`}>
                  {isUploadingImage ? "Uploading..." : "Upload Image"}
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
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="Or paste image URL"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
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

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => void handleSave()}
                disabled={isSaving || isUploadingImage}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => void handleToggleActive()}
                disabled={isSaving}
                className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                  product.isActive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {product.isActive ? "Deactivate Product" : "Activate Product"}
              </button>
              <button
                onClick={() => void loadProduct()}
                disabled={isSaving}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Metadata</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-gray-500">Created</p>
                <p className="font-medium text-gray-900">
                  {new Date(product.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="mb-1 text-gray-500">Last Updated</p>
                <p className="font-medium text-gray-900">
                  {new Date(product.updatedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="mb-1 text-gray-500">Product ID</p>
                <p className="break-all font-mono text-gray-900">{product.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
