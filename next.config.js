/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    env: {
        // Copy dotenvx values to process.env for middleware
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.shopify.com',
                pathname: '/**',
            },
        ],
    },
};

module.exports = nextConfig;
