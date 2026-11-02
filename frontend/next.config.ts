import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone, which the production Docker image runs.
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
