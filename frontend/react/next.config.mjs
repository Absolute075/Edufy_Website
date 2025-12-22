/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'resources.edufyuzbekistan.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/:userId(\\d+)/resources/:path*',
        destination: '/resources/:path*',
      },
    ];
  },
};

export default nextConfig;
