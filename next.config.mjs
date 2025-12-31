/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // GitHub Pages configuration
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/Doorly_Dashboard',
  images: {
    unoptimized: true,
  },
  // Note: GitHub Pages doesn't support API routes
  // API routes (/api/linkedin) will not work on GitHub Pages
  // For API routes, use Vercel instead (recommended)
};

export default nextConfig;


