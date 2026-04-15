const DOMAIN_PROTOCOL_REGEX = /^https?:\/\//i;

function normalizeDomainHost(domain) {
    if (!domain) {
        return '';
    }

    return domain
        .trim()
        .toLowerCase()
        .replace(DOMAIN_PROTOCOL_REGEX, '')
        .replace(/\/.*$/, '');
}

const resolvedPublicSiteDomain =
    normalizeDomainHost(process.env.NEXT_PUBLIC_SITE_DOMAIN || process.env.SITE_DOMAIN) || 'buildmyonlineweb.site';

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https:;
    style-src 'self' 'unsafe-inline' https:;
    img-src 'self' blob: data: https:;
    media-src 'self' blob: data: https:;
    font-src 'self' data: https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
    connect-src 'self' https: wss:;
`.replace(/\n/g, '').trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@booking-engine/core', '@booking-engine/themes', '@booking-engine/types', '@booking-engine/ui'],
    output: 'standalone',
    env: {
        NEXT_PUBLIC_SITE_DOMAIN: resolvedPublicSiteDomain,
    },
    async headers() {
        return [
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/login',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate',
                    },
                ],
            },
            {
                source: '/register',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate',
                    },
                ],
            },
            {
                source: '/forgot-password',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate',
                    },
                ],
            },
            {
                source: '/reset-password',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate',
                    },
                ],
            },
            {
                source: '/dashboard/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate',
                    },
                ],
            },
            {
                source: '/onboarding/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate',
                    },
                ],
            },
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: cspHeader.replace(/\s{2,}/g, ' ')
                    }
                ]
            }
        ];
    }
};

export default nextConfig;
