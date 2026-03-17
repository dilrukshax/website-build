"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../../lib/api-client";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

interface BookingDetails {
  id: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  service: {
    name: string;
    description?: string | null;
    duration?: number | null;
    price: number;
    currency: string;
  };
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalPrice: number;
  currency: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

function getStatusBadgeClasses(status: BookingStatus): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "confirmed":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "no_show":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-red-100 text-red-800 border-red-200";
  }
}

function getStatusLabel(status: BookingStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
}

export default function BookingDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const bookingId = params.id;
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<"confirm" | "complete" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  async function loadBooking() {
    setIsLoading(true);
    setError(null);
    const res = await api.get<BookingDetails>(`/cms/bookings/${bookingId}`);
    if (res.success && res.data) {
      setBooking(res.data);
    } else {
      setError(res.error?.message || "Failed to load booking details.");
    }
    setIsLoading(false);
  }

  async function updateStatus(action: "confirm" | "complete") {
    if (!booking) return;
    setIsUpdating(action);
    const res = await api.post(`/cms/bookings/${booking.id}/${action}`);
    if (res.success) {
      await loadBooking();
    } else {
      alert(res.error?.message || "Failed to update booking status.");
    }
    setIsUpdating(null);
  }

  async function cancelBooking() {
    if (!booking) return;
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setIsUpdating("cancel");
    const res = await api.del(`/cms/bookings/${booking.id}`);
    if (res.success) {
      await loadBooking();
    } else {
      alert(res.error?.message || "Failed to cancel booking.");
    }
    setIsUpdating(null);
  }

  if (isLoading) {
    return <div className="legacy-theme text-gray-500">Loading booking details...</div>;
  }

  if (error || !booking) {
    return (
      <div className="legacy-theme space-y-4">
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to bookings
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          {error || "Booking not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="legacy-theme w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mt-1"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Booking {booking.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Created {new Date(booking.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClasses(
            booking.status,
          )}`}
        >
          {getStatusLabel(booking.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Start Time</p>
                <p className="font-medium text-gray-900">
                  {new Date(booking.startTime).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">End Time</p>
                <p className="font-medium text-gray-900">
                  {new Date(booking.endTime).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Name</p>
                <p className="font-medium text-gray-900">
                  {booking.customer.firstName} {booking.customer.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Email</p>
                <p className="font-medium text-gray-900">{booking.customer.email}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Phone</p>
                <p className="font-medium text-gray-900">{booking.customer.phone || "-"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Service Name</p>
                <p className="font-medium text-gray-900">{booking.service.name}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Price</p>
                <p className="font-medium text-gray-900">
                  {Number(booking.totalPrice).toFixed(2)} {booking.currency}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Duration</p>
                <p className="font-medium text-gray-900">
                  {booking.service.duration ? `${booking.service.duration} minutes` : "-"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500 mb-1">Description</p>
                <p className="font-medium text-gray-900">
                  {booking.service.description || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {booking.notes || "No notes for this booking."}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              {booking.status === "pending" && (
                <button
                  onClick={() => updateStatus("confirm")}
                  disabled={isUpdating !== null}
                  className="w-full px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isUpdating === "confirm" ? "Confirming..." : "Confirm Booking"}
                </button>
              )}

              {booking.status === "confirmed" && (
                <button
                  onClick={() => updateStatus("complete")}
                  disabled={isUpdating !== null}
                  className="w-full px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isUpdating === "complete" ? "Completing..." : "Mark as Completed"}
                </button>
              )}

              {(booking.status === "pending" || booking.status === "confirmed") && (
                <button
                  onClick={cancelBooking}
                  disabled={isUpdating !== null}
                  className="w-full px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isUpdating === "cancel" ? "Cancelling..." : "Cancel Booking"}
                </button>
              )}

              <button
                onClick={loadBooking}
                disabled={isUpdating !== null}
                className="w-full px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Refresh Details
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Booking ID</p>
                <p className="font-mono text-gray-900 break-all">{booking.id}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Last Updated</p>
                <p className="font-medium text-gray-900">
                  {new Date(booking.updatedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Currency</p>
                <p className="font-medium text-gray-900">{booking.currency}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
