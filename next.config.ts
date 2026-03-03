import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  async headers() {
    // Cache static pages at CDN and browser (free-tier friendly when traffic spikes)
    const staticCache = "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60";
    const staticRoutes = [
      { source: "/", headers: [{ key: "Cache-Control", value: staticCache }] },
      { source: "/about", headers: [{ key: "Cache-Control", value: staticCache }] },
      { source: "/work", headers: [{ key: "Cache-Control", value: staticCache }] },
      { source: "/contact", headers: [{ key: "Cache-Control", value: staticCache }] },
      { source: "/architecture", headers: [{ key: "Cache-Control", value: staticCache }] },
      { source: "/war-room", headers: [{ key: "Cache-Control", value: staticCache }] },
    ];
    return [
      ...staticRoutes,
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
