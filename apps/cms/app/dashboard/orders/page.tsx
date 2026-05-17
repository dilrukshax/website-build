"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api-client";

interface OrderItem {
  id: string;
  nameSnapshot: string;
  quantity: number;
  unitPrice: number;
}
interface OrderEvent {
  type: string;
  message: string | null;
  actor: string;
  createdAt: string;
}
interface Order {
  id: string;
  orderNumber: string;
  email: string;
  currency: string;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  items?: OrderItem[];
  events?: OrderEvent[];
}

const STATUSES = [
  "", "pending", "awaiting_payment", "paid", "awaiting_approval",
  "approved", "fulfilling", "shipped", "delivered", "cancelled",
  "refunded", "on_hold",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = statusFilter ? `?status=${statusFilter}` : "";
      const res = await api.get<Order[]>(`/cms/orders${q}`);
      if (res.success && res.data) setOrders(res.data);
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openOrder = async (id: string) => {
    const res = await api.get<Order>(`/cms/orders/${id}`);
    if (res.success && res.data) setSelected(res.data);
  };

  const act = async (path: string, body?: Record<string, unknown>) => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post(`/cms/orders/${selected.id}/${path}`, body ?? {});
      if (!res.success) {
        setError(res.error?.message || "Action failed");
      } else {
        await openOrder(selected.id);
        await load();
      }
    } catch {
      setError("Action failed");
    } finally {
      setBusy(false);
    }
  };

  const addShipment = async () => {
    if (!selected) return;
    const trackingNumber = window.prompt("Tracking number");
    if (!trackingNumber) return;
    const carrier = window.prompt("Carrier") || undefined;
    setBusy(true);
    try {
      const res = await api.put(`/cms/orders/${selected.id}/shipment`, {
        trackingNumber,
        carrier,
        status: "in_transit",
      });
      if (!res.success) setError(res.error?.message || "Failed");
      else {
        await openOrder(selected.id);
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  const placeSupplier = async () => {
    const supplierOrderRef = window.prompt("Supplier order reference");
    if (!supplierOrderRef) return;
    await act("place-supplier-order", { supplierOrderRef });
  };

  const refund = async () => {
    const amount = Number(window.prompt("Refund amount"));
    if (!amount || amount <= 0) return;
    await act("refunds", { amount, reason: "Owner-issued refund" });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <select
          className="border rounded px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s || "All statuses"}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded bg-red-50 text-red-700 px-4 py-2 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Order</th>
                <th className="text-left px-3 py-2">Total</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Payment</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                    No orders yet
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => openOrder(o.id)}
                    className="cursor-pointer border-t hover:bg-gray-50"
                  >
                    <td className="px-3 py-2 font-medium">{o.orderNumber}</td>
                    <td className="px-3 py-2">
                      {o.currency} {Number(o.grandTotal).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">{o.status}</td>
                    <td className="px-3 py-2">{o.paymentStatus}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border rounded p-4">
          {!selected ? (
            <p className="text-gray-500 text-sm">Select an order to manage it.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{selected.orderNumber}</h2>
                <p className="text-sm text-gray-500">{selected.email}</p>
                <p className="text-sm">
                  {selected.currency} {Number(selected.grandTotal).toFixed(2)} ·{" "}
                  <strong>{selected.status}</strong> · pay:{" "}
                  {selected.paymentStatus} · fulfil:{" "}
                  {selected.fulfillmentStatus}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Items</h3>
                <ul className="text-sm list-disc ml-5">
                  {selected.items?.map((i) => (
                    <li key={i.id}>
                      {i.nameSnapshot} × {i.quantity} —{" "}
                      {selected.currency} {Number(i.unitPrice).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  disabled={busy}
                  onClick={() => act("mark-paid", { provider: "manual" })}
                  className="bg-emerald-600 text-white rounded px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Mark paid
                </button>
                <button
                  disabled={busy}
                  onClick={() => act("approve")}
                  className="bg-indigo-600 text-white rounded px-3 py-1.5 text-sm disabled:opacity-50"
                  title="Mandatory owner approval gate before any supplier purchase"
                >
                  Approve supplier purchase
                </button>
                <button
                  disabled={busy}
                  onClick={placeSupplier}
                  className="bg-blue-600 text-white rounded px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Record supplier order
                </button>
                <button
                  disabled={busy}
                  onClick={addShipment}
                  className="bg-slate-700 text-white rounded px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Add tracking
                </button>
                <button
                  disabled={busy}
                  onClick={() => act("hold", { reason: "Owner hold" })}
                  className="bg-amber-600 text-white rounded px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Hold
                </button>
                <button
                  disabled={busy}
                  onClick={() => act("cancel", { reason: "Owner cancel" })}
                  className="bg-red-600 text-white rounded px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={busy}
                  onClick={refund}
                  className="bg-rose-700 text-white rounded px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Refund
                </button>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Timeline</h3>
                <ul className="text-xs space-y-1 max-h-56 overflow-auto">
                  {selected.events?.map((e, idx) => (
                    <li key={idx} className="text-gray-600">
                      <span className="font-mono">{e.type}</span> — {e.message}{" "}
                      <span className="text-gray-400">({e.actor})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
