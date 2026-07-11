'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { Search, Download, Plus, CalendarDays, MoreHorizontal } from 'lucide-react';
import { api } from '../../../lib/api-client';

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

interface BookingStats {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
}

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

function statusBadgeClass(status: string): string {
    if (status === 'pending') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    if (status === 'confirmed') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (status === 'completed') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
}

function formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<BookingStats>({
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    useEffect(() => {
        loadBookings();
        loadStats();
    }, []);

    async function loadBookings() {
        const res = await api.get<Booking[]>('/cms/bookings');
        if (res.success && res.data) {
            setBookings(Array.isArray(res.data) ? res.data : []);
        }
        setIsLoading(false);
    }

    async function loadStats() {
        const res = await api.get<BookingStats>('/cms/bookings/stats');
        if (res.success && res.data) {
            setStats(res.data);
        }
    }

    async function updateStatus(id: string, action: 'confirm' | 'complete') {
        const res = await api.post(`/cms/bookings/${id}/${action}`);
        if (res.success) {
            await Promise.all([loadBookings(), loadStats()]);
        }
    }

    async function cancelBooking(id: string) {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        const res = await api.del(`/cms/bookings/${id}`);
        if (res.success) {
            await Promise.all([loadBookings(), loadStats()]);
        }
    }

    const filteredBookings = useMemo(() => {
        const normalizedTerm = searchTerm.trim().toLowerCase();
        return bookings.filter((booking) => {
            const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
            if (!matchesStatus) return false;

            if (!normalizedTerm) return true;
            const bookingId = booking.id.toLowerCase();
            const customerName = `${booking.customer.firstName} ${booking.customer.lastName}`.toLowerCase();
            const customerEmail = booking.customer.email.toLowerCase();
            const serviceName = booking.service.name.toLowerCase();

            return (
                bookingId.includes(normalizedTerm) ||
                customerName.includes(normalizedTerm) ||
                customerEmail.includes(normalizedTerm) ||
                serviceName.includes(normalizedTerm)
            );
        });
    }, [bookings, searchTerm, statusFilter]);

    if (isLoading) {
        return (
            <div className="be-card flex min-h-[260px] items-center justify-center p-6">
                <p className="text-sm text-slate-500">Loading bookings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Bookings</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage and monitor all service reservations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                    <Link
                        href="/dashboard/bookings"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#dc2626]/25 transition hover:bg-[#b91c1c]"
                    >
                        <Plus className="h-4 w-4" />
                        New Booking
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="be-card p-4">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="be-card p-4">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</p>
                    <p className="mt-2 text-3xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <div className="be-card p-4">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Confirmed</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.confirmed}</p>
                </div>
                <div className="be-card p-4">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p>
                    <p className="mt-2 text-3xl font-bold text-red-600">{stats.completed}</p>
                </div>
                <div className="be-card p-4">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cancelled</p>
                    <p className="mt-2 text-3xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
            </div>

            <div className="be-card p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by booking ID, customer, email, or service..."
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 dark:border-slate-700 dark:bg-slate-900"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {STATUS_FILTERS.map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                                    statusFilter === status
                                        ? 'bg-[#dc2626] text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="be-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-[960px] w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Service</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date & Time</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id} className="transition-colors hover:bg-[#dc2626]/5">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {booking.customer.firstName} {booking.customer.lastName}
                                        </p>
                                        <p className="text-xs text-slate-500">{booking.customer.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{booking.service.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {Number(booking.totalPrice).toFixed(2)} {booking.currency}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                            {new Date(booking.startTime).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                                            {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`be-pill ${statusBadgeClass(booking.status)}`}>{formatStatus(booking.status)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex items-center gap-3">
                                            <Link
                                                href={`/dashboard/bookings/${booking.id}`}
                                                className="text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                            >
                                                View
                                            </Link>
                                            {booking.status === 'pending' && (
                                                <button
                                                    onClick={() => updateStatus(booking.id, 'confirm')}
                                                    className="text-sm font-medium text-[#dc2626] transition-colors hover:text-[#b91c1c]"
                                                >
                                                    Confirm
                                                </button>
                                            )}
                                            {booking.status === 'confirmed' && (
                                                <button
                                                    onClick={() => updateStatus(booking.id, 'complete')}
                                                    className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                            {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                                <button
                                                    onClick={() => cancelBooking(booking.id)}
                                                    className="text-sm font-medium text-red-600 transition-colors hover:text-red-700"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            <button className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#dc2626] dark:hover:bg-slate-800">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredBookings.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                                            <CalendarDays className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No bookings found</p>
                                        <p className="mt-1 text-xs text-slate-500">Try adjusting search or status filters.</p>
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
