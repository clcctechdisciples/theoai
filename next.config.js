/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'bible-api.com' },
    ],
  },
}

module.exports = nextConfig
