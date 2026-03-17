/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@booking-engine/core', '@booking-engine/themes', '@booking-engine/types', '@booking-engine/ui'],
    output: 'standalone',
};

export default nextConfig;

