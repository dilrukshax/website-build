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
    Globe,
    PaintBucket,
} from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import { InstanceSwitcher } from './instance-switcher';
import { TenantSwitcher } from './tenant-switcher';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    permission?: string;
}

const NAV_ITEMS: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard size={20} />,
    },
    {
        label: 'Website Builder',
        href: '/dashboard/builder',
        icon: <PaintBucket size={20} />,
        permission: 'website.view',
    },
    {
        label: 'Bookings',
        href: '/dashboard/bookings',
        icon: <Calendar size={20} />,
        permission: 'bookings.view',
    },
    {
        label: 'Services',
        href: '/dashboard/services',
        icon: <Briefcase size={20} />,
        permission: 'services.view',
    },
    {
        label: 'Customers',
        href: '/dashboard/customers',
        icon: <Users size={20} />,
        permission: 'customers.view',
    },
    {
        label: 'Inquiries',
        href: '/dashboard/inquiries',
        icon: <Mail size={20} />,
        permission: 'inquiries.view',
    },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
    {
        label: 'Instances',
        href: '/dashboard/instances',
        icon: <Building2 size={20} />,
    },
    {
        label: 'Staff',
        href: '/dashboard/staff',
        icon: <UserCog size={20} />,
        permission: 'staff.view',
    },
    {
        label: 'Roles',
        href: '/dashboard/roles',
        icon: <ShieldCheck size={20} />,
        permission: 'roles.view',
    },
    {
        label: 'Settings',
        href: '/dashboard/settings',
        icon: <Settings size={20} />,
        permission: 'settings.view',
    },
];

const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
    {
        label: 'All Tenants',
        href: '/dashboard/superadmin/tenants',
        icon: <Globe size={20} />,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, hasPermission, logout } = useAuth();

    function isActive(href: string) {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    }

    function filterByPermission(items: NavItem[]) {
        return items.filter((item) => !item.permission || hasPermission(item.permission));
    }

    return (
        <aside className="w-64 h-screen bg-gray-900 flex flex-col shrink-0">
            {/* Tenant Switcher (only shows if multiple tenants) */}
            <TenantSwitcher />

            {/* Instance Switcher */}
            <div className="p-4 border-b border-gray-800">
                <InstanceSwitcher />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {/* Standard Tenant Navigation */}
                {filterByPermission(NAV_ITEMS).map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive(item.href)
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                    >
                        <span className="w-5 h-5">{item.icon}</span>
                        {item.label}
                    </Link>
                ))}

                {/* Admin section */}
                <div className="pt-4 mt-4 border-t border-gray-800">
                    <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Administration
                    </p>
                    {filterByPermission(ADMIN_NAV_ITEMS).map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isActive(item.href)
                                    ? 'bg-gray-800 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            <span className="w-5 h-5">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* Super Admin section */}
                {user?.isSuperAdmin && (
                    <div className="pt-4 mt-4 border-t border-gray-800">
                        <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Super Admin
                        </p>
                        {SUPER_ADMIN_NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isActive(item.href)
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                            >
                                <span className="w-5 h-5">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm">
                        {user?.fullName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors"
                        title="Sign out"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
