'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';
import { Sidebar } from '../../components/sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isLoading, isAuthenticated, tenants, currentTenant } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) return;

        // Redirect to onboarding if no tenant
        if (tenants.length === 0) {
            router.push('/onboarding/create-organization');
            return;
        }

        // Redirect to create instance if tenant exists but no instances
        // (this will be checked after instances load)
    }, [isLoading, isAuthenticated, tenants, currentTenant, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    // Don't render dashboard if user needs onboarding
    if (tenants.length === 0) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
