import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
// E2E_API_TARGET is server-only (no NEXT_PUBLIC prefix) so local UI tests can
// proxy relative /api calls to an offline stub without exposing it client-side.
const apiBase =
  process.env.E2E_API_TARGET || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://payfollows.vercel.app';

const nextConfig = {
  reactStrictMode: true,
  // This app lives in the `web/` workspace folder of a repo that also has a
  // root lockfile — tell Next to trace files relative to this folder.
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
  // Proxy legacy backend API routes during local development and as a fallback
  // so the client can keep using relative `/api/...` paths.
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiBase}/api/:path*` },
    ];
  },
};

export default nextConfig;
