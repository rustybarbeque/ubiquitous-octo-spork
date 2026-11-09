import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone, which the production Docker image runs.
  output: "standalone",
  images: {
    // Product images are whatever URL an administrator pastes in, from any
    // host. Unoptimized means the browser loads them directly rather than
    // through Next's resizing proxy, which would otherwise need every host
    // allow-listed. A broken link falls back to a local placeholder; see
    // components/ProductImage.tsx.
    unoptimized: true,
  },
};

export default nextConfig;
