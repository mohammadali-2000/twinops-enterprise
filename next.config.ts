import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  transpilePackages: [],
  // Render (and most PaaS hosts) run "next start" directly, which Next.js
  // warns is incompatible with "output: standalone". Docker instead runs
  // "node server.js" and needs standalone mode. The Dockerfile sets
  // BUILD_STANDALONE=1 before building so only that build opts in.
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
