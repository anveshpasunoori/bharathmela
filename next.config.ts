import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
// Listing photos may be served from object storage or a CDN (S3_PUBLIC_URL, see src/lib/photos.ts).
const photoOrigin = process.env.S3_PUBLIC_URL ? new URL(process.env.S3_PUBLIC_URL) : null;

// Next.js needs inline scripts for hydration; dev mode also needs eval and websockets for hot reload.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Map tiles for the listings map (src/components/ListingsMap.tsx).
  `img-src 'self' data: blob: https://tile.openstreetmap.org${photoOrigin ? ` ${photoOrigin.origin}` : ""}`,
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Listing forms carry up to 6 photos of 8 MB each.
  experimental: { serverActions: { bodySizeLimit: "50mb" } },
  images: photoOrigin ? { remotePatterns: [{ protocol: photoOrigin.protocol.replace(":", "") as "https" | "http", hostname: photoOrigin.hostname, pathname: "/**" }] } : undefined,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
