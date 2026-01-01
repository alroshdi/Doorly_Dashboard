/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel deployment: Full Next.js features (API routes, server-side rendering)
  // GitHub Pages: Static export only (when NEXT_PUBLIC_BASE_PATH is set)
  ...(process.env.NODE_ENV === 'production' && 
      process.env.NEXT_PUBLIC_BASE_PATH && 
      !process.env.VERCEL // Only use static export for GitHub Pages, not Vercel
    ? {
        output: 'export',
        basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/Doorly_Dashboard',
        images: {
          unoptimized: true,
        },
        trailingSlash: true,
      }
    : {
        // Vercel or Development mode - full Next.js features enabled
        images: {
          unoptimized: false,
        },
      }),
};

export default nextConfig;


