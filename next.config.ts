import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "is*.mzstatic.com",
      },
    ],
  },
};

export default nextConfig;
