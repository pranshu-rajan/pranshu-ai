import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    const isProd = process.env.NODE_ENV === "production";
    const defaultBackend = isProd ? "https://pranshu-ai.onrender.com" : "http://localhost:8000";
    const backendTarget = 
      process.env.INTERNAL_API_URL || 
      process.env.NEXT_PUBLIC_API_URL || 
      defaultBackend;
    return [
      {
        source: "/api/:path*",
        destination: `${backendTarget.replace(/\/+$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
