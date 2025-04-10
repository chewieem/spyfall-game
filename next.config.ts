import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    return config;
  },
  async rewrites() {
    return [];
  }
};

export default nextConfig;
