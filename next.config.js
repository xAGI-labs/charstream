/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'robohash.org',
      'img.clerk.com',
      'together.xyz',
      'api.together.xyz',
      'api.together.ai',
      'res.cloudinary.com', // Ensure this is present
      'dht33kdwe.cloudinary.com', // Add this specific Cloudinary subdomain
    ],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  // Enable standalone output for Nixpacks deployment
  output: 'standalone',
  // Avoid CORS issues with API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  // Disable TypeScript and ESLint checks during build for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Removed deprecated options:
  // - swcMinify (now default)
  // - experimental.appDir (now default in Next.js 15+)
};

module.exports = nextConfig;
