import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  assetPrefix: "", // Empty string, not './'
  basePath: "",
};

export default nextConfig;
