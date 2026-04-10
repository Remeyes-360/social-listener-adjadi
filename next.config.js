/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['pbs.twimg.com', 'instagram.com', 'facebook.com', 'linkedin.com', 'tiktok.com'],
  },
};

module.exports = nextConfig;
