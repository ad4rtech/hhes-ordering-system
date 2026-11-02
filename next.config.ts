import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }];
    return [
      "/admin", "/admin/:path*", "/rep", "/rep/:path*", "/api/:path*", "/auth/:path*",
      "/login", "/forgot-password", "/reset-password", "/set-password", "/register/complete",
    ].map((source) => ({ source, headers: noindex }));
  },
};

export default nextConfig;