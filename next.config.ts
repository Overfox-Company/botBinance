import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bin.bnbstatic.com",
      },
    ],
  },
};

export default nextConfig;
