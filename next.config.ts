import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  transpilePackages: [],
  // Produces a minimal, self-contained build in .next/standalone for Docker,
  // instead of needing the full node_modules folder copied into the image.
  output: "standalone",
};

export default nextConfig;
