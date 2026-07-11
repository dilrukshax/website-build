'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    ArrowRight,
    BookText,
    Briefcase,
    Calendar,
    Check,
    Mail,
    Package,
    Users,
} from 'lucide-react';
import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { useAuth } from '../../contexts/auth-context';
import { api } from '../../lib/api-client';
import { getInstanceDisplayDomain } from '../../lib/domain';
import { DomainSupportContact } from '../../components/domain-support-contact';

interface ServiceSummary {
    id: string;
}

interface PublishHistoryItem {
    id: string;
    status: string;
}

interface BookingStats {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
}

interface RecentBooking {
    id: string;
    status: string;
    startTime: string;
    customer?: { firstName?: string; lastName?: string; email?: string } | null;
    service?: { name?: string } | null;
}

interface RecentInquiry {
    id: string;
    name?: string;
    email?: string;
    status?: string;
    createdAt: string;
}

interface SetupStep {
    id: string;
    title: string;
    description: string;
    href: string;
    done: boolean;
}

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#dc2626',
    completed: '#16a34a',
    cancelled: '#94a3b8',
};

function timeAgo(dateStr: string): string {
    const then = new Date(dateStr).getTime();
    if (Number.isNaN(then)) return '';
    const diffMs = Date.now() - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

function statusBadgeClass(status?: string): string {
    switch ((status || '').toLowerCase()) {
        case 'pending':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
        case 'confirmed':
            return 'bg-[#dc2626]/10 text-[#dc2626] dark:bg-[#dc2626]/20 dark:text-[#fca5a5]';
        case 'completed':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'cancelled':
            return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
        case 'resolved':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
        default:
            return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    }
}

export default function DashboardPage() {
    const { currentTenant, currentInstance, loadInstances, hasPermission } = useAuth();
    const [serviceCount, setServiceCount] = useState(0);
    const [hasPublishedWebsite, setHasPublishedWebsite] = useState(false);

    const canViewBookings = hasPermission('bookings.view');
    const canViewCustomers = hasPermission('customers.view');
    const canViewInquiries = hasPermission('inquiries.view');
    const canViewProducts = hasPermission('products.view');
    const canViewBlogs = hasPermission('blogs.view');

    const [productsCount, setProductsCount] = useState(0);
    const [customersCount, setCustomersCount] = useState(0);
    const [inquiriesCount, setInquiriesCount] = useState(0);
    const [blogsCount, setBlogsCount] = useState(0);
    const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
    const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
    const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([]);

    useEffect(() => {
        let isCancelled = false;

        async function loadServiceCount() {
            if (!currentTenant || !currentInstance?.id) {
                if (!isCancelled) {
                    setServiceCount(0);
                }
                return;
            }

            const res = await api.get<ServiceSummary[]>('/cms/services');
            if (isCancelled) {
                return;
            }

            if (res.success && Array.isArray(res.data)) {
                setServiceCount(res.data.length);
            } else {
                setServiceCount(0);
            }
        }

        void loadServiceCount();

        return () => {
            isCancelled = true;
        };
    }, [currentTenant?.id, currentInstance?.id]);

    useEffect(() => {
        let isCancelled = false;

        async function loadPublishStatus() {
            if (!currentTenant || !currentInstance?.id) {
                if (!isCancelled) {
                    setHasPublishedWebsite(false);
                }
                return;
            }

            const res = await api.get<PublishHistoryItem[]>('/cms/builder/publish/history');
            if (isCancelled) {
                return;
            }

            if (res.success && Array.isArray(res.data)) {
                setHasPublishedWebsite(res.data.some((record) => record.status === 'published'));
            } else {
                setHasPublishedWebsite(false);
            }
        }

        void loadPublishStatus();

        return () => {
            isCancelled = true;
        };
    }, [currentTenant?.id, currentInstance?.id]);

    useEffect(() => {
        if (!currentTenant?.id || !currentInstance?.id) {
            return;
        }

        let isCancelled = false;

        async function loadOverview() {
            const requests: Promise<void>[] = [];

            if (canViewProducts) {
                requests.push((async () => {
                    const res = await api.get<unknown[]>('/cms/products');
                    if (!isCancelled && res.success && Array.isArray(res.data)) {
                        setProductsCount(res.data.length);
                    }
                })());
            }

            if (canViewBlogs) {
                requests.push((async () => {
                    const res = await api.get<unknown[]>('/cms/blogs');
                    if (!isCancelled && res.success && Array.isArray(res.data)) {
                        setBlogsCount(res.data.length);
                    }
                })());
            }

            if (canViewCustomers) {
                requests.push((async () => {
                    const res = await api.get<unknown[]>('/cms/customers');
                    if (!isCancelled && res.success) {
                        setCustomersCount(res.meta?.total ?? (Array.isArray(res.data) ? res.data.length : 0));
                    }
                })());
            }

            if (canViewInquiries) {
                requests.push((async () => {
                    const res = await api.get<RecentInquiry[]>('/cms/inquiries?limit=5');
                    if (!isCancelled && res.success) {
                        setInquiriesCount(res.meta?.total ?? (Array.isArray(res.data) ? res.data.length : 0));
                        setRecentInquiries(Array.isArray(res.data) ? res.data : []);
                    }
                })());
            }

            if (canViewBookings) {
                requests.push((async () => {
                    const statsRes = await api.get<BookingStats>('/cms/bookings/stats');
                    if (!isCancelled && statsRes.success && statsRes.data) {
                        setBookingStats(statsRes.data);
                    }
                })());
                requests.push((async () => {
                    const res = await api.get<RecentBooking[]>('/cms/bookings?limit=5');
                    if (!isCancelled && res.success && Array.isArray(res.data)) {
                        setRecentBookings(res.data);
                    }
                })());
            }

            await Promise.all(requests);
        }

        void loadOverview();

        return () => {
            isCancelled = true;
        };
    }, [
        currentTenant?.id,
        currentInstance?.id,
        canViewProducts,
        canViewBlogs,
        canViewCustomers,
        canViewInquiries,
        canViewBookings,
    ]);

    const setupSteps = useMemo<SetupStep[]>(() => {
        const hasOrganization = Boolean(currentTenant);
        const hasServices = serviceCount > 0;
        const hasCustomizedWebsite = hasPublishedWebsite;

        return [
            {
                id: 'organization',
                title: 'Create your oraganazation',
                description: hasOrganization
                    ? 'Organization is created and ready.'
                    : 'Create your organization to continue setup.',
                href: '/onboarding/create-organization',
                done: hasOrganization,
            },
            {
                id: 'services',
                title: 'Add services',
                description: hasServices
                    ? `${serviceCount} service${serviceCount === 1 ? '' : 's'} added.`
                    : 'Add your first service customers can book.',
                href: '/dashboard/services',
                done: hasServices,
            },
            {
                id: 'customize',
                title: 'Customize web site',
                description: hasCustomizedWebsite
                    ? 'Website customizations were published.'
                    : 'Open Website Builder and customize your pages.',
                href: '/dashboard/builder',
                done: hasCustomizedWebsite,
            },
        ];
    }, [currentTenant, hasPublishedWebsite, serviceCount]);

    const statCards = useMemo(() => {
        const cards: Array<{
            label: string;
            value: string;
            icon: typeof Briefcase;
            href: string;
        }> = [
            {
                label: 'Services',
                value: String(serviceCount),
                icon: Briefcase,
                href: '/dashboard/services',
            },
        ];

        if (canViewProducts) {
            cards.push({
                label: 'Products',
                value: String(productsCount),
                icon: Package,
                href: '/dashboard/products',
            });
        }

        if (canViewBookings) {
            cards.push({
                label: 'Bookings',
                value: String(bookingStats?.total ?? 0),
                icon: Calendar,
                href: '/dashboard/bookings',
            });
        }

        if (canViewCustomers) {
            cards.push({
                label: 'Customers',
                value: String(customersCount),
                icon: Users,
                href: '/dashboard/customers',
            });
        }

        if (canViewInquiries) {
            cards.push({
                label: 'Inquiries',
                value: String(inquiriesCount),
                icon: Mail,
                href: '/dashboard/inquiries',
            });
        }

        if (canViewBlogs) {
            cards.push({
                label: 'Blogs',
                value: String(blogsCount),
                icon: BookText,
                href: '/dashboard/blogs',
            });
        }

        return cards;
    }, [
        serviceCount,
        productsCount,
        bookingStats,
        customersCount,
        inquiriesCount,
        blogsCount,
        canViewProducts,
        canViewBookings,
        canViewCustomers,
        canViewInquiries,
        canViewBlogs,
    ]);

    const bookingStatusData = useMemo(() => {
        if (!bookingStats) return [];
        return [
            { name: 'Pending', value: bookingStats.pending, key: 'pending' },
            { name: 'Confirmed', value: bookingStats.confirmed, key: 'confirmed' },
            { name: 'Completed', value: bookingStats.completed, key: 'completed' },
            { name: 'Cancelled', value: bookingStats.cancelled, key: 'cancelled' },
        ].filter((item) => item.value > 0);
    }, [bookingStats]);

    const recentActivity = useMemo(() => {
        const items: Array<{
            id: string;
            type: 'booking' | 'inquiry';
            title: string;
            subtitle: string;
            status?: string;
            at: string;
        }> = [];

        for (const booking of recentBookings) {
            const rawCustomerName = booking.customer
                ? `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim()
                : '';
            const customerName = rawCustomerName || booking.customer?.email || 'Customer';
            items.push({
                id: `booking-${booking.id}`,
                type: 'booking',
                title: customerName,
                subtitle: booking.service?.name || 'Booking',
                status: booking.status,
                at: booking.startTime,
            });
        }

        for (const inquiry of recentInquiries) {
            items.push({
                id: `inquiry-${inquiry.id}`,
                type: 'inquiry',
                title: inquiry.name || 'Inquiry',
                subtitle: inquiry.email || 'New inquiry',
                status: inquiry.status,
                at: inquiry.createdAt,
            });
        }

        return items
            .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
            .slice(0, 6);
    }, [recentBookings, recentInquiries]);

    const customDomain = currentInstance?.customDomain?.trim().toLowerCase() || '';
    const hasCustomDomain = Boolean(customDomain);
    const domainForMessage = customDomain || getInstanceDisplayDomain(currentInstance) || 'yourdomain.com';

    const hostnameStatus = (currentInstance?.customDomainHostnameStatus || '').toLowerCase();
    const sslStatus = (currentInstance?.customDomainSslStatus || '').toLowerCase();
    const fallbackDomainConnected = Boolean(
        customDomain
        && (currentInstance?.customDomainIsActive === true
            || (hostnameStatus === 'active' && sslStatus === 'active')),
    );
    const domainConnected = fallbackDomainConnected;

    const domainStatusText = domainConnected
        ? `Your domain ${customDomain} is connected to your account.`
        : `Your domain ${customDomain} is currently under way to connect.`;
    const showDomainSetupSupport = hasCustomDomain && !domainConnected;

    useEffect(() => {
        if (!currentTenant?.id || !currentInstance?.id || !hasCustomDomain || domainConnected) {
            return;
        }

        void loadInstances();
        const intervalId = setInterval(() => {
            void loadInstances();
        }, 30000);

        return () => {
            clearInterval(intervalId);
        };
    }, [currentTenant?.id, currentInstance?.id, hasCustomDomain, domainConnected, loadInstances]);

    return (
        <div className="space-y-6">
            {hasCustomDomain && (
                <section className={`rounded-2xl border px-5 py-4 ${
                    domainConnected
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
                        : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
                }`}>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide dark:bg-slate-900/60">
                            {domainConnected ? 'Connected' : 'Pending'}
                        </span>
                        <p className="text-sm font-semibold">{domainStatusText}</p>
                    </div>
                    <p className="mt-1 text-xs">
                        {domainConnected
                            ? 'Domain setup is complete.'
                            : 'DNS connection usually takes 12 to 24 hours to complete.'}
                    </p>
                </section>
            )}

            {showDomainSetupSupport && (
                <section className="be-card p-6">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Domain Setup Support</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Need help connecting your domain? Contact support to finish setup.
                        </p>
                    </div>
                    <DomainSupportContact domain={domainForMessage} />
                </section>
            )}

            {!currentInstance ? (
                <section className="be-card flex min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center">
                    <Briefcase className="h-9 w-9 text-[#dc2626]" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Select a website</h2>
                    <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                        Choose an active website from the switcher above to see your dashboard overview,
                        activity charts, and recent bookings or inquiries.
                    </p>
                </section>
            ) : (
                <section className="space-y-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Overview</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                A live snapshot of your website&apos;s activity and content.
                            </p>
                        </div>
                        <span className="rounded-full bg-[#dc2626]/10 px-3 py-1 text-xs font-semibold text-[#dc2626] dark:bg-[#dc2626]/20 dark:text-[#fca5a5]">
                            {currentInstance.name}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                        {statCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Link
                                    key={card.label}
                                    href={card.href}
                                    className="be-card group flex flex-col gap-3 p-4 transition hover:border-[#dc2626]/30"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dc2626]/10 text-[#dc2626]">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {canViewBookings && (
                            <section className="be-card p-5">
                                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                                    <Calendar className="h-5 w-5 text-[#dc2626]" />
                                    Bookings by Status
                                </h3>
                                {bookingStatusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie
                                                data={bookingStatusData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={95}
                                                label={(entry: { name: string; value: number }) => `${entry.name}: ${entry.value}`}
                                                labelLine={false}
                                            >
                                                {bookingStatusData.map((entry) => (
                                                    <Cell
                                                        key={entry.key}
                                                        fill={STATUS_COLORS[entry.key] || '#dc2626'}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-[260px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                                        No bookings yet.
                                    </div>
                                )}
                            </section>
                        )}

                        {(canViewBookings || canViewInquiries) && (
                            <section className="be-card p-5">
                                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                                    <ArrowRight className="h-5 w-5 text-[#dc2626]" />
                                    Recent Activity
                                </h3>
                                {recentActivity.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentActivity.map((item) => {
                                            const Icon = item.type === 'booking' ? Calendar : Mail;
                                            return (
                                                <div key={item.id} className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#dc2626]/10 text-[#dc2626]">
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                                            {item.title}
                                                        </p>
                                                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                            {item.subtitle}
                                                        </p>
                                                    </div>
                                                    {item.status && (
                                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusBadgeClass(item.status)}`}>
                                                            {item.status}
                                                        </span>
                                                    )}
                                                    <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">
                                                        {timeAgo(item.at)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex h-[260px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                                        No recent activity yet.
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                </section>
            )}

            <section className="be-card overflow-hidden p-0">
                <div className="border-b border-slate-200 bg-gradient-to-r from-[#f2f1ff] to-[#fef2f2] px-5 py-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Getting Started</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Follow these 3 steps to launch your booking website.
                        </p>
                    </div>
                </div>

                <div className="space-y-4 p-5">
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                        {setupSteps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`rounded-xl border p-4 transition ${
                                    step.done
                                        ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-900/10'
                                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                                }`}
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-lg font-black ${
                                        step.done
                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                            : 'border-[#dc2626] bg-[#dc2626]/10 text-[#dc2626]'
                                    }`}>
                                        {step.done ? <Check className="h-6 w-6" /> : index + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Step {index + 1}: {step.title}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                            {step.description}
                                        </p>
                                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                            step.done
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                : 'bg-[#dc2626]/10 text-[#dc2626] dark:bg-[#dc2626]/20 dark:text-[#a9a4ff]'
                                        }`}>
                                            {step.done ? 'Completed' : 'Pending'}
                                        </span>
                                    </div>
                                    <Link
                                        href={step.href}
                                        className="inline-flex items-center gap-1 self-start rounded-lg border border-[#dc2626]/25 bg-[#dc2626]/10 px-3 py-1.5 text-xs font-semibold text-[#dc2626] transition hover:bg-[#dc2626]/15 hover:text-[#b91c1c] sm:self-center"
                                    >
                                        Open
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
