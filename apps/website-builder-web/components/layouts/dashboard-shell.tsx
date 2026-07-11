'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';
import { Sidebar } from '../sidebar';

export function DashboardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isLoading, isAuthenticated, tenants, currentTenant, switchTenant, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isBuilderPage = pathname.startsWith('/dashboard/builder');
    const isSuperAdmin = user?.isSuperAdmin === true;

    useEffect(() => {
        let isCancelled = false;

        async function ensureDashboardContext() {
            if (isLoading || !isAuthenticated) return;

            if (isSuperAdmin) {
                if (pathname === '/dashboard') {
                    router.replace('/dashboard/superadmin');
                }
                return;
            }

            // Redirect to onboarding if no tenant
            if (tenants.length === 0) {
                router.replace('/onboarding/create-organization');
                return;
            }

            // Recover a tenant context if list exists but no active tenant is selected yet.
            if (!currentTenant) {
                const firstTenant = tenants[0];
                if (!firstTenant) {
                    router.replace('/onboarding/create-organization');
                    return;
                }

                const switched = await switchTenant(firstTenant.id);
                if (isCancelled) {
                    return;
                }

                if (!switched.success) {
                    router.replace('/onboarding/create-organization');
                }
            }
        }

        void ensureDashboardContext();

        return () => {
            isCancelled = true;
        };
    }, [isLoading, isAuthenticated, tenants, currentTenant, switchTenant, router, isSuperAdmin, pathname]);

    if (isLoading) {
        return (
            <div className="be-app-bg flex min-h-screen items-center justify-center">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    // Don't render dashboard if user needs onboarding or tenant is still being recovered.
    if (!isSuperAdmin && (tenants.length === 0 || !currentTenant)) {
        return null;
    }

    return (
        <div className="be-app-bg flex h-screen overflow-hidden">
            <Sidebar />
            <main className={isBuilderPage ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto'}>
                <div className={isBuilderPage ? 'h-full' : 'w-full p-6 md:p-8'}>
                    {children}
                </div>
            </main>
        </div>
    );
}
