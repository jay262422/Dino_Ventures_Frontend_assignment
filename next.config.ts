import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "v3b.fal.media", pathname: "/**" },
      { protocol: "https", hostname: "media.samajsaathi.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
