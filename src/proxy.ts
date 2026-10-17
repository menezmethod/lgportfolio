/**
 * Proxy (formerly middleware) for visitor analytics.
 *
 * Runs on EVERY request before the route handler. Logs structured visitor data
 * to stdout using the shared classifier in lib/telemetry.
 *
 * Metrics counters are handled by /api/analytics/page-view (server-side).
 */
import { NextResponse, type NextRequest } from "next/server";

// Single shared classifier (same one the page-view route and telemetry use).
import { classifyVisitor, summarizeUA } from "./lib/telemetry";

// ── Static asset and Next.js internal request filter ────────────────────────

const STATIC_EXT_RE = /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|map|txt)$/;
const INTERNAL_PATH_RE = /^\/_next\//;

function shouldSkip(path: string): boolean {
  return STATIC_EXT_RE.test(path) || INTERNAL_PATH_RE.test(path);
}

// ── Middleware ────────────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip static assets and Next.js internals
  if (shouldSkip(path)) {
    return NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent") || "";
  const referrer = request.headers.get("referer") || "";

  // Classify and log as structured JSON → Cloud Logging
  const category = classifyVisitor(userAgent);
  const entry = {
    severity: "INFO" as const,
    message: "Visitor",
    category,
    path,
    referrer: referrer.slice(0, 200),
    ua_summary: summarizeUA(userAgent),
    timestamp: new Date().toISOString(),
    type: "visitor_analytics",
  };
  console.log(JSON.stringify(entry));

  // Attach visitor category as response header (for debugging / API pickup)
  const response = NextResponse.next();
  response.headers.set("x-visitor-category", category);
  return response;
}

export const config = {
  matcher: [
    // Match all paths except _next static, api/_next, and favicon
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
