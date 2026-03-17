'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    Briefcase,
    Users,
    Mail,
    Building2,
    UserCog,
    ShieldCheck,
    Settings,
    LogOut,
    PaintBucket,
    Sparkles,
    Star,
    MessageSquare,
    Gift,
    CreditCard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import { InstanceSwitcher } from './instance-switcher';
import { TenantSwitcher } from './tenant-switcher';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    permission?: string;
}

const NAV_ITEMS: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        label: 'Website Builder',
        href: '/dashboard/builder',
        icon: PaintBucket,
        permission: 'website.view',
    },
    {
        label: 'Bookings',
        href: '/dashboard/bookings',
        icon: Calendar,
        permission: 'bookings.view',
    },
    {
        label: 'Services',
        href: '/dashboard/services',
        icon: Briefcase,
        permission: 'services.view',
    },
    {
        label: 'Customers',
        href: '/dashboard/customers',
        icon: Users,
        permission: 'customers.view',
    },
    {
        label: 'Inquiries',
        href: '/dashboard/inquiries',
        icon: Mail,
        permission: 'inquiries.view',
    },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
    {
        label: 'Instances',
        href: '/dashboard/instances',
        icon: Building2,
    },
    {
        label: 'Staff',
        href: '/dashboard/staff',
        icon: UserCog,
        permission: 'staff.view',
    },
    {
        label: 'Roles',
        href: '/dashboard/roles',
        icon: ShieldCheck,
        permission: 'roles.view',
    },
    {
        label: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        permission: 'settings.view',
    },
    {
        label: 'Feedback',
        href: '/dashboard/feedback-rating',
        icon: Star,
    },
    {
        label: 'Suggestions',
        href: '/dashboard/feedback-suggestions',
        icon: MessageSquare,
    },
    {
        label: 'Referrals',
        href: '/dashboard/referrals',
        icon: Gift,
    },
    {
        label: 'Billing',
        href: '/dashboard/billing',
        icon: CreditCard,
    },
];

const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/dashboard/superadmin',
        icon: LayoutDashboard,
    },
    {
        label: 'Feedback',
        href: '/dashboard/superadmin/feedback',
        icon: MessageSquare,
    },
    {
        label: 'Billing Reviews',
        href: '/dashboard/superadmin/billing',
        icon: CreditCard,
    },
    {
        label: 'Referral Reviews',
        href: '/dashboard/superadmin/referrals',
        icon: Gift,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, hasPermission, logout } = useAuth();
    const isSuperAdmin = user?.isSuperAdmin === true;

    function isActive(href: string) {
        if (href === '/dashboard') return pathname === '/dashboard';
        if (href === '/dashboard/superadmin') return pathname === '/dashboard/superadmin';
        return pathname.startsWith(href);
    }

    function filterByPermission(items: NavItem[]) {
        return items.filter((item) => !item.permission || hasPermission(item.permission));
    }

    return (
        <aside className="h-screen w-64 shrink-0 border-r border-[#5048e5]/10 bg-white dark:bg-[#121121]/70">
            <div className="flex h-full flex-col">
                <div className="border-b border-[#5048e5]/10 p-5">
                    <Link href="/dashboard" className="flex items-center gap-2 text-[#5048e5]">
                        <Sparkles size={18} />
                        <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                            buildmyonlineweb
                        </span>
                    </Link>
                </div>

                <div className="space-y-3 border-b border-[#5048e5]/10 p-4">
                    {!isSuperAdmin && <TenantSwitcher />}
                    {!isSuperAdmin && <InstanceSwitcher />}
                </div>

                <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
                    {isSuperAdmin ? (
                        <div>
                            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Super Admin
                            </p>
                            {SUPER_ADMIN_NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                            active
                                                ? 'bg-[#5048e5] text-white shadow-sm shadow-[#5048e5]/20'
                                                : 'text-slate-600 hover:bg-[#5048e5]/5 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                                        }`}
                                    >
                                        <Icon size={18} className={active ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1">
                                {filterByPermission(NAV_ITEMS).map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                                active
                                                    ? 'bg-[#5048e5] text-white shadow-sm shadow-[#5048e5]/20'
                                                    : 'text-slate-600 hover:bg-[#5048e5]/5 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                                            }`}
                                        >
                                            <Icon size={18} className={active ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="mt-auto pt-5">
                                <div className="border-t border-[#5048e5]/10 pt-4">
                                    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Administration
                                    </p>
                                    {filterByPermission(ADMIN_NAV_ITEMS).map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                                    active
                                                        ? 'bg-[#5048e5] text-white shadow-sm shadow-[#5048e5]/20'
                                                        : 'text-slate-600 hover:bg-[#5048e5]/5 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                                                }`}
                                            >
                                                <Icon size={18} className={active ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </nav>

                <div className="border-t border-[#5048e5]/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5048e5]/10 text-sm font-semibold text-[#5048e5]">
                            {user?.fullName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user?.fullName}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-[#5048e5]/10 hover:text-[#5048e5]"
                            title="Sign out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
