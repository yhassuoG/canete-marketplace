import type { NextConfig } from "next";

const API_BACKEND = process.env.API_BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.100.19", "192.168.0.0/16", "10.0.0.0/8", "172.16.0.0/12"],
  async rewrites() {
    return [
      // Proxy API requests to the Spring Boot backend.
      // This makes /api/* and /uploads/* same-origin from the browser's
      // perspective, so they work from any device (localhost, LAN IP, phone)
      // without CORS issues or hardcoded localhost URLs.
      { source: "/api/:path*", destination: `${API_BACKEND}/api/:path*` },
      { source: "/uploads/:path*", destination: `${API_BACKEND}/uploads/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Disable COOP so Google OAuth popup (window.closed) works
          { key: "Cross-Origin-Opener-Policy", value: "unsafe-none" },
          { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none" },
        ],
      },
    ];
  },
};

export default nextConfig;
