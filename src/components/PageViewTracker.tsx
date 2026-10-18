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
 * (with an optional ?src= tag and, on the first page, document.referrer),
 * /api/analytics/event on resume, GitHub, LinkedIn, and email clicks, and
 * /api/analytics/leave with active time on the page when it is hidden or closed.
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

  // Active time on the current page, sent with sendBeacon when the page is hidden or closed.
  const active = useRef({ path: "", ms: 0, since: 0 });
  useEffect(() => {
    active.current = { path: pathname, ms: 0, since: document.visibilityState === "visible" ? Date.now() : 0 };
  }, [pathname]);
  useEffect(() => {
    const onVisibility = () => {
      const a = active.current;
      if (document.visibilityState === "hidden") {
        if (a.since) a.ms += Date.now() - a.since;
        a.since = 0;
        if (!navigator.webdriver && a.path && !a.path.startsWith("/admin")) {
          navigator.sendBeacon?.("/api/analytics/leave", JSON.stringify({ path: a.path, ms: a.ms }));
        }
      } else if (!a.since) {
        a.since = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

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
