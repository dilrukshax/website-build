"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api-client";

interface Supplier {
  id: string;
  displayName: string;
  type: string;
  status: string;
}
interface ImportRow {
  id: string;
  supplierItemRef: string;
  sourceUrl: string | null;
  status: string;
  reviewNote: string | null;
  createdAt: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState("");

  // Assisted-manual import form (works without AliExpress API access — design §7)
  const [form, setForm] = useState({
    supplierId: "",
    supplierItemRef: "",
    sourceUrl: "",
    name: "",
    description: "",
    imageUrl: "",
    variantSku: "",
    variantCost: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, i] = await Promise.all([
        api.get<Supplier[]>("/cms/suppliers"),
        api.get<ImportRow[]>("/cms/imports"),
      ]);
      if (s.success && s.data) setSuppliers(s.data);
      if (i.success && i.data) setImports(i.data);
    } catch {
      setError("Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createSupplier = async () => {
    if (!supplierName.trim()) return;
    const res = await api.post<Supplier>("/cms/suppliers", {
      type: "aliexpress",
      displayName: supplierName.trim(),
    });
    if (res.success) {
      setSupplierName("");
      setMessage("Supplier created");
      await load();
    } else setError(res.error?.message || "Failed");
  };

  const createImport = async () => {
    setError(null);
    setMessage(null);
    if (!form.supplierId || !form.supplierItemRef || !form.name || !form.variantCost) {
      setError("Supplier, item ref, product name and variant cost are required");
      return;
    }
    const res = await api.post("/cms/imports", {
      supplierId: form.supplierId,
      supplierItemRef: form.supplierItemRef,
      sourceUrl: form.sourceUrl || undefined,
      raw: { source: "assisted-manual" },
      normalized: {
        name: form.name,
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
        variants: [
          {
            sku: form.variantSku || undefined,
            cost: Number(form.variantCost),
            availability: "in_stock",
          },
        ],
      },
    });
    if (res.success) {
      setMessage("Import created — review then approve to publish");
      setForm((f) => ({ ...f, supplierItemRef: "", name: "", variantCost: "" }));
      await load();
    } else setError(res.error?.message || "Import failed");
  };

  const review = async (id: string, action: "approve" | "reject") => {
    setError(null);
    const res = await api.post(`/cms/imports/${id}/${action}`, {});
    if (res.success) {
      setMessage(action === "approve" ? "Published to catalog" : "Import rejected");
      await load();
    } else setError(res.error?.message || "Action failed");
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <h1 className="text-2xl font-semibold">Suppliers & Product Imports</h1>

      {message && (
        <div className="rounded bg-green-50 text-green-700 px-4 py-2 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded bg-red-50 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Suppliers</h2>
        <div className="flex gap-2">
          <input
            className="border rounded px-3 py-2 text-sm flex-1"
            placeholder="Supplier display name (e.g. AliExpress Main)"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
          />
          <button
            onClick={createSupplier}
            className="bg-black text-white rounded px-4 py-2 text-sm"
          >
            Add supplier
          </button>
        </div>
        <ul className="text-sm divide-y border rounded">
          {suppliers.map((s) => (
            <li key={s.id} className="px-3 py-2 flex justify-between">
              <span>
                {s.displayName}{" "}
                <span className="text-gray-400">({s.type})</span>
              </span>
              <span className="text-gray-500">{s.status}</span>
            </li>
          ))}
          {suppliers.length === 0 && (
            <li className="px-3 py-2 text-gray-500">No suppliers yet</li>
          )}
        </ul>
      </section>

      <section className="space-y-3 border-t pt-6">
        <h2 className="text-lg font-medium">Import a product (assisted-manual)</h2>
        <p className="text-sm text-gray-500">
          Paste supplier details for owner review. Nothing is published until
          you approve it (review-before-publish, design §9).
        </p>
        <div className="grid grid-cols-2 gap-3">
          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.supplierId}
            onChange={(e) =>
              setForm((f) => ({ ...f, supplierId: e.target.value }))
            }
          >
            <option value="">Select supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName}
              </option>
            ))}
          </select>
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Supplier item ref / id"
            value={form.supplierItemRef}
            onChange={(e) =>
              setForm((f) => ({ ...f, supplierItemRef: e.target.value }))
            }
          />
          <input
            className="border rounded px-3 py-2 text-sm col-span-2"
            placeholder="Source URL (AliExpress product URL)"
            value={form.sourceUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, sourceUrl: e.target.value }))
            }
          />
          <input
            className="border rounded px-3 py-2 text-sm col-span-2"
            placeholder="Product name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <textarea
            className="border rounded px-3 py-2 text-sm col-span-2 min-h-[70px]"
            placeholder="Cleaned product description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <input
            className="border rounded px-3 py-2 text-sm col-span-2"
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, imageUrl: e.target.value }))
            }
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Variant SKU (optional)"
            value={form.variantSku}
            onChange={(e) =>
              setForm((f) => ({ ...f, variantSku: e.target.value }))
            }
          />
          <input
            type="number"
            className="border rounded px-3 py-2 text-sm"
            placeholder="Supplier cost"
            value={form.variantCost}
            onChange={(e) =>
              setForm((f) => ({ ...f, variantCost: e.target.value }))
            }
          />
        </div>
        <button
          onClick={createImport}
          className="bg-black text-white rounded px-4 py-2 text-sm"
        >
          Create import for review
        </button>
      </section>

      <section className="space-y-3 border-t pt-6">
        <h2 className="text-lg font-medium">Imports queue</h2>
        <table className="w-full text-sm border rounded overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Item ref</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {imports.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="px-3 py-2">{i.supplierItemRef}</td>
                <td className="px-3 py-2">{i.status}</td>
                <td className="px-3 py-2 space-x-2">
                  {i.status !== "published" && i.status !== "rejected" && (
                    <>
                      <button
                        onClick={() => review(i.id, "approve")}
                        className="text-emerald-700 underline"
                      >
                        Approve & publish
                      </button>
                      <button
                        onClick={() => review(i.id, "reject")}
                        className="text-red-700 underline"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {imports.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-gray-500 text-center">
                  No imports yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
