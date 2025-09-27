import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
};

export default nextConfig;
