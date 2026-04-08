import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "streetviewpixels-pa.googleapis.com" },
    ],
  },
  output: "standalone",
};

export default nextConfig;
