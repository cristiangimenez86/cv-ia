import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Standalone output for optimized Docker builds */
  output: "standalone",
};

export default nextConfig;
