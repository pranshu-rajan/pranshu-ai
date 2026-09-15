import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    const backendTarget = 
      process.env.INTERNAL_API_URL || 
      process.env.NEXT_PUBLIC_API_URL || 
      "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendTarget.replace(/\/+$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
