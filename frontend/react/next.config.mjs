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
};

export default nextConfig;
