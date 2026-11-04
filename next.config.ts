import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: supabase?.protocol === "http:" ? "http" : "https",
        hostname: supabase?.hostname ?? "*.supabase.co",
        port: supabase?.port ?? "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Always render <title>/<meta> in <head> (not streamed), so every crawler and
  // link-preview scraper sees them. Metadata lookups are cached, so this is cheap.
  htmlLimitedBots: /.*/,
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
