import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint rules are configured in .eslintrc.json
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
};

export default nextConfig;
