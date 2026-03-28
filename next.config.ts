import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: allow LAN / private IPv4 hosts when Origin is e.g. http://10.x.x.x:3000
  // (same wildcard rules as remotePatterns — one * per dot-separated segment)
  allowedDevOrigins: ["10.*.*.*", "172.*.*.*", "192.*.*.*"],
};

export default nextConfig;
