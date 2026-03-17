'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminTenantsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/superadmin/referrals');
    }, [router]);

    return (
        <div className="text-sm text-slate-500 dark:text-slate-400">
            Tenant management has been removed from Super Admin.
        </div>
    );
}
