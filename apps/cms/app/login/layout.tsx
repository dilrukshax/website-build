import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const metadata: Metadata = {
    title: 'Sign in | buildmyonlineweb',
    description: 'Sign in to your buildmyonlineweb dashboard.',
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
