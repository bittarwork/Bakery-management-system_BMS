import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Standalone output bundles everything needed to run without node_modules
  output: "standalone",

  // Set workspace root to silence turbopack warning about multiple lockfiles
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
