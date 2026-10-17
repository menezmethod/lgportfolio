"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Client-side analytics: pings /api/analytics/page-view on every page navigation.
 * Fire-and-forget — does not block rendering.
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

    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    // Fire and forget — no await, no error handling needed
    fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true, // Ensures request completes even during navigation
    }).catch(() => {
      /* swallow — analytics should never break the page */
    });
  }, [pathname]);

  return null;
}
