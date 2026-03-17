'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Search, MailQuestion } from 'lucide-react';
import { api } from '../../../lib/api-client';

interface InquiryCustomerSummary {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
}

interface Inquiry {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    status: string;
    sourceType: 'contact_form' | 'booking_form' | null;
    sourcePageSlug: string | null;
    createdAt: string;
    customer: InquiryCustomerSummary | null;
}

function statusClass(status: string): string {
    if (status === 'new') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    if (status === 'in_progress') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    if (status === 'resolved') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

function formatStatus(status: string): string {
    return status.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSource(inquiry: Inquiry): string {
    const sourceType = inquiry.sourceType === 'contact_form'
        ? 'Contact Form'
        : inquiry.sourceType === 'booking_form'
            ? 'Booking Form'
            : 'Unknown Source';

    if (!inquiry.sourcePageSlug) {
        return sourceType;
    }

    return `${sourceType} (${inquiry.sourcePageSlug})`;
}

export default function InquiriesPage() {
    const searchParams = useSearchParams();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const presetSearch = searchParams.get('search') || '';
        setSearchTerm(presetSearch);
    }, [searchParams]);

    useEffect(() => {
        loadInquiries();
    }, []);

    async function loadInquiries() {
        setIsLoading(true);
        setError('');
        const res = await api.get<Inquiry[]>('/cms/inquiries');
        if (res.success && res.data) {
            setInquiries(Array.isArray(res.data) ? res.data : []);
        } else {
            setError(res.error?.message || 'Failed to load inquiries');
        }
        setIsLoading(false);
    }

    const filteredInquiries = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return inquiries;
        return inquiries.filter((inquiry) =>
            inquiry.name.toLowerCase().includes(term) ||
            inquiry.email.toLowerCase().includes(term) ||
            inquiry.message.toLowerCase().includes(term) ||
            (inquiry.sourcePageSlug || '').toLowerCase().includes(term),
        );
    }, [inquiries, searchTerm]);

    if (isLoading) {
        return (
            <div className="be-card flex min-h-[260px] items-center justify-center p-6">
                <p className="text-sm text-slate-500">Loading inquiries...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Inquiries</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Track contact-form inquiries and linked customers.
                </p>
            </div>

            <div className="be-card p-4">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by customer name, email, message, or source page..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#5048e5] focus:ring-2 focus:ring-[#5048e5]/20 dark:border-slate-700 dark:bg-slate-900"
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
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Contact</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Message</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Source</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Linked Customer</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Received</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredInquiries.map((inquiry) => (
                                <tr key={inquiry.id} className="transition-colors hover:bg-[#5048e5]/5">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{inquiry.name}</p>
                                        <p className="text-xs text-slate-500">{inquiry.email}</p>
                                        <p className="text-xs text-slate-500">{inquiry.phone || 'No phone'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                        <p className="max-w-xl truncate">{inquiry.message}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                        {formatSource(inquiry)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                        {inquiry.customer
                                            ? `${inquiry.customer.firstName} ${inquiry.customer.lastName}`
                                            : 'Not linked'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`be-pill ${statusClass(inquiry.status)}`}>{formatStatus(inquiry.status)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                        {new Date(inquiry.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                        <Link
                                            href={`/dashboard/customers?search=${encodeURIComponent(inquiry.email)}`}
                                            className="font-medium text-[#5048e5] hover:underline"
                                        >
                                            View Customer
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filteredInquiries.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                                            <MailQuestion className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No inquiries found</p>
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
