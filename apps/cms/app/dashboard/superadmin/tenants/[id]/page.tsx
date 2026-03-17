'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminTenantDetailsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/superadmin/referrals');
    }, [router]);

    return (
        <div className="text-sm text-slate-500 dark:text-slate-400">
            Tenant details have been removed from Super Admin.
        </div>
    );
}
