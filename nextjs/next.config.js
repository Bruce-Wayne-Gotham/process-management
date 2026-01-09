/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  compress: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  outputFileTracingIncludes: {
    '/**/*': ['./sql/**/*'],
  },
  experimental: {
    isrMemoryCacheSize: 0, // Disable ISR memory cache
  },
};

module.exports = nextConfig;
