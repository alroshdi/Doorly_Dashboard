/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only use static export for production builds (GitHub Pages)
  // In development, we need full Next.js features (API routes, etc.)
  ...(process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_BASE_PATH
    ? {
        output: 'export',
        basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/Doorly_Dashboard',
        images: {
          unoptimized: true,
        },
        trailingSlash: true,
      }
    : {
        // Development mode - full Next.js features enabled
        images: {
          unoptimized: false,
        },
      }),
  // Note: GitHub Pages doesn't support API routes
  // API routes (/api/linkedin) will not work on GitHub Pages
  // For API routes, use Vercel instead (recommended)
};

export default nextConfig;


