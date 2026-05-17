/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: '**.instagram.com' },
      { protocol: 'https', hostname: '**.facebook.com' },
      { protocol: 'https', hostname: '**.linkedin.com' },
      { protocol: 'https', hostname: '**.tiktok.com' },
    ],
  },
};

module.exports = nextConfig;
