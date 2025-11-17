import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Remove assetPrefix completely or set to empty string
};

export default nextConfig;
