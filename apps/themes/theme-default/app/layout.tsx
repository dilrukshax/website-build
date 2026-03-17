import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        template: '%s | Default Theme',
        default: 'Default Theme',
    },
    description: 'A customer-ready booking website theme.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
