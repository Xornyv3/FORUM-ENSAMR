import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  async headers() {
    const immutableCache = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return [
      { source: "/assets/creation-study.7c7e1bd6b192.webp", headers: immutableCache },
      { source: "/assets/creation-study-mobile.f22eff57dc9b.webp", headers: immutableCache },
      { source: "/assets/humanxmachine.b1258adc36a0.mp4", headers: immutableCache },
    ];
  },
};

export default nextConfig;
