import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
      {
        protocol: "https",
        //https://nextjs.org/docs/messages/next-image-unconfigured-host
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  headers: async () => [
    {
      // MCP Server endpoints - allow same-origin framing for MCP Apps
      source: "/api/mcp/server/:path*",
      headers: [
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        {
          key: "Content-Security-Policy",
          value: "frame-ancestors 'self'",
        },
      ],
    },
    {
      // MCP Client endpoints - CORS for cross-origin requests
      source: "/api/mcp/client",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        {
          key: "Access-Control-Allow-Methods",
          value: "GET, POST, OPTIONS",
        },
        {
          key: "Access-Control-Allow-Headers",
          value: "Content-Type",
        },
      ],
    },
  ],
};

export default nextConfig;
