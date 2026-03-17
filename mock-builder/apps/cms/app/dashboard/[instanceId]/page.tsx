import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Instance Dashboard',
};

/**
 * Instance-scoped dashboard page.
 * TODO: Implement per-instance overview once UIX spec is delivered.
 */
export default function InstancePage({
    params,
}: {
    params: { instanceId: string };
}) {
    return (
        <div>
            <h1>Instance: {params.instanceId}</h1>
            <p>Instance-specific content will appear here.</p>
        </div>
    );
}
