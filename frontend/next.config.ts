import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(currentDir, "..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: workspaceRoot,
  images: {
    qualities: [75, 90]
  },
  turbopack: {
    root: workspaceRoot
  },
};

export default nextConfig;
