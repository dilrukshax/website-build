import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/auth-context';
import './globals.css';

export const metadata: Metadata = {
    title: {
        template: '%s | buildmyonlineweb CMS',
        default: 'buildmyonlineweb CMS',
    },
    description: 'Multi-tenant SaaS booking management platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
