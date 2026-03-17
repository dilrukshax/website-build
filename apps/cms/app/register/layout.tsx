import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const metadata: Metadata = {
    title: 'Create account | buildmyonlineweb',
    description: 'Create your buildmyonlineweb account.',
};

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
