/**
 * Edge middleware for visitor analytics.
 *
 * Runs on EVERY request before the route handler. Logs structured visitor data
 * to stdout (auto-ingested by Cloud Logging). Cannot import server modules,
 * so classification logic is duplicated inline.
 *
 * Metrics counters are handled by /api/analytics/page-view (server-side).
 */
import { NextResponse, type NextRequest } from "next/server";

// ── Visitor Classification (edge-safe, no imports) ─────────────────────────

type VisitorCategory = "recruiter" | "person" | "crawler" | "bot" | "unknown";

function classifyVisitor(userAgent: string): VisitorCategory {
  if (!userAgent || userAgent.length < 10) return "unknown";
  const ua = userAgent.toLowerCase();

  const recruiterSignals = [
    "linkedin", "greenhouse", "lever.co", "workday", "indeed",
    "glassdoor", "ziprecruiter", "hackerrank", "codility",
    "ashbyhq", "breezy", "smartrecruiters", "icims",
    "recruitee", "jazzhr", "bullhorn", "jobvite",
  ];
  if (recruiterSignals.some((s) => ua.includes(s))) return "recruiter";

  const crawlerSignals = [
    "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider",
    "yandexbot", "facebot", "facebookexternalhit", "twitterbot",
    "linkedinbot", "applebot", "semrush", "ahrefsbot", "majestic",
    "dotbot", "rogerbot", "crawler", "spider", "scrapy",
  ];
  if (crawlerSignals.some((s) => ua.includes(s))) return "crawler";

  const botSignals = [
    "curl/", "wget/", "python-requests", "go-http-client", "axios",
    "node-fetch", "httpx", "aiohttp", "okhttp", "postman",
    "insomnia", "httpie", "java/", "libcurl",
  ];
  if (botSignals.some((s) => ua.includes(s))) return "bot";

  const browserSignals = ["mozilla", "chrome/", "safari/", "firefox/", "edg/", "opr/", "gecko"];
  if (browserSignals.some((s) => ua.includes(s))) return "person";

  return "unknown";
}

function summarizeUA(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("linkedin")) return "LinkedIn";
  if (ua.includes("greenhouse")) return "Greenhouse";
  if (ua.includes("googlebot")) return "Googlebot";
  if (ua.includes("bingbot")) return "Bingbot";
  if (ua.includes("chrome/")) return "Chrome";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("safari/") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("curl/")) return "curl";
  if (ua.includes("python-requests")) return "Python";
  if (ua.includes("postman")) return "Postman";
  return userAgent.slice(0, 60);
}

// ── Static asset and Next.js internal request filter ────────────────────────

const STATIC_EXT_RE = /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|map|txt)$/;
const INTERNAL_PATH_RE = /^\/_next\//;

function shouldSkip(path: string): boolean {
  return STATIC_EXT_RE.test(path) || INTERNAL_PATH_RE.test(path);
}

// ── Middleware ────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
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
