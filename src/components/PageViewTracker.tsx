"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Which outbound click an anchor href counts as, if any. */
export function clickEventFor(href: string): string | null {
  const h = href.toLowerCase();
  if (h.endsWith(".pdf") && h.includes("resume")) return "resume_download";
  if (h.includes("github.com/")) return "github_click";
  if (h.includes("linkedin.com/")) return "linkedin_click";
  if (h.startsWith("mailto:") || h.includes("/cdn-cgi/l/email-protection")) return "email_click";
  return null;
}

function send(url: string, body: Record<string, unknown>) {
  // Fire and forget: keepalive lets it finish during navigation; analytics never breaks the page.
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Client-side analytics: pings /api/analytics/page-view on every page navigation
 * (with an optional ?src= tag from the link), and /api/analytics/event on resume,
 * GitHub, LinkedIn, and email clicks.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  // StrictMode (dev) runs effects twice; one view = one POST.
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Skip static page views and admin routes for privacy
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/_next") ||
      pathname === "/favicon.ico"
    ) {
      return;
    }

    // Automated browsers (Lighthouse, Puppeteer, Playwright, Cypress) set navigator.webdriver.
    if (navigator.webdriver) return;
    if (lastPath.current === pathname) return;
    // document.referrer only means "where they came from" on the first page of the tab.
    const ref = lastPath.current === null ? document.referrer || undefined : undefined;
    lastPath.current = pathname;

    const src = new URLSearchParams(window.location.search).get("src")?.toLowerCase() || undefined;
    send("/api/analytics/page-view", { path: pathname, src, ref });
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      const name = a ? clickEventFor(a.href) : null;
      if (name && !navigator.webdriver && !window.location.pathname.startsWith("/admin")) {
        send("/api/analytics/event", { name, path: window.location.pathname });
      }
    };
    // auxclick catches middle-click "open in new tab".
    for (const t of ["click", "auxclick"] as const) document.addEventListener(t, onClick, { capture: true });
    return () => {
      for (const t of ["click", "auxclick"] as const) document.removeEventListener(t, onClick, { capture: true });
    };
  }, []);

  return null;
}
