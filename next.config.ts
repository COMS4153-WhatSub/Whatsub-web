import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Disable source maps to avoid path encoding issues with spaces in workspace path
  productionBrowserSourceMaps: false,
  // Suppress dev tools source map warnings for paths with spaces
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
