import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-email/render': require.resolve('@react-email/render'),
    };
    return config;
  },
};

export default nextConfig;
