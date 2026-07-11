'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { api } from '../../../lib/api-client';

interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    notes: string | null;
    bookingCount: number;
    inquiryCount: number;
    lastInquiryAt: string | null;
    lastInquirySourcePageSlug: string | null;
    createdAt: string;
}

export default function CustomersPage() {
    const searchParams = useSearchParams();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const presetSearch = searchParams.get('search') || '';
        setSearchTerm(presetSearch);
    }, [searchParams]);

    useEffect(() => {
        loadCustomers();
    }, []);

    async function loadCustomers() {
        setIsLoading(true);
        setError('');
        const res = await api.get<Customer[]>('/cms/customers');
        if (res.success && res.data) {
            setCustomers(Array.isArray(res.data) ? res.data : []);
        } else {
            setError(res.error?.message || 'Failed to load customers');
        }
        setIsLoading(false);
    }

    const filteredCustomers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return customers;
        return customers.filter((customer) =>
            `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(term) ||
            customer.email.toLowerCase().includes(term) ||
            (customer.phone || '').toLowerCase().includes(term) ||
            (customer.lastInquirySourcePageSlug || '').toLowerCase().includes(term),
        );
    }, [customers, searchTerm]);

    if (isLoading) {
        return (
            <div className="be-card flex min-h-[260px] items-center justify-center p-6">
                <p className="text-sm text-slate-500">Loading customers...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Customers</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    View customer contact details, booking volume, and inquiry sources.
                </p>
            </div>

            <div className="be-card p-4">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, email, phone, or source page..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 dark:border-slate-700 dark:bg-slate-900"
                    />
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            )}

            <div className="be-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-[1200px] w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Bookings</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Inquiries</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Last Inquiry Source</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Joined</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="transition-colors hover:bg-[#dc2626]/5">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {customer.firstName} {customer.lastName}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{customer.email}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{customer.phone || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{customer.bookingCount}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{customer.inquiryCount}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                        {customer.lastInquirySourcePageSlug || '—'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                        {new Date(customer.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                        <Link
                                            href={`/dashboard/inquiries?search=${encodeURIComponent(customer.email)}`}
                                            className="font-medium text-[#dc2626] hover:underline"
                                        >
                                            View Inquiries
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                                            <Users className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No customers found</p>
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
