"use client";

import { useState, useEffect } from "react";
import { api } from "../../../lib/api-client";

interface Booking {
  id: string;
  customer: { firstName: string; lastName: string; email: string };
  service: { name: string; price: number; currency: string };
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    loadBookings();
    loadStats();
  }, []);

  async function loadBookings() {
    const res = await api.get<Booking[]>("/cms/bookings");
    if (res.success && res.data) {
      setBookings(res.data);
    }
    setIsLoading(false);
  }

  async function loadStats() {
    // any used directly due to simplicity, but specifying the type
    const res = await api.get<{
      total: number;
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    }>("/cms/bookings/stats");
    if (res.success && res.data) {
      setStats(res.data);
    }
  }

  async function updateStatus(id: string, action: "confirm" | "complete") {
    const res = await api.post(`/cms/bookings/${id}/${action}`);
    if (res.success) {
      loadBookings();
      loadStats();
    }
  }

  async function cancelBooking(id: string) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    const res = await api.del(`/cms/bookings/${id}`);
    if (res.success) {
      loadBookings();
      loadStats();
    }
  }

  if (isLoading) {
    return <div className="text-gray-500 p-6">Loading bookings...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all service bookings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pending</p>
          <p className="mt-2 text-3xl font-bold text-yellow-600">
            {stats.pending}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Confirmed</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {stats.confirmed}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Completed</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {stats.completed}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Cancelled</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {stats.cancelled}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Service
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Time
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {booking.customer.email}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="font-medium text-gray-900">
                    {booking.service.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {Number(booking.totalPrice).toFixed(2)} {booking.currency}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="font-medium text-gray-800">
                    {new Date(booking.startTime).toLocaleDateString()}
                  </div>
                  <div className="text-gray-500">
                    {new Date(booking.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(booking.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      booking.status === "pending"
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        : booking.status === "confirmed"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : booking.status === "completed"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                    }`}
                  >
                    {booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1).replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right space-x-3">
                  {booking.status === "pending" && (
                    <button
                      onClick={() => updateStatus(booking.id, "confirm")}
                      className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                    >
                      Confirm
                    </button>
                  )}
                  {booking.status === "confirmed" && (
                    <button
                      onClick={() => updateStatus(booking.id, "complete")}
                      className="text-green-600 hover:text-green-900 font-medium transition-colors"
                    >
                      Complete
                    </button>
                  )}
                  {(booking.status === "pending" ||
                    booking.status === "confirmed") && (
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      className="text-red-600 hover:text-red-900 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
