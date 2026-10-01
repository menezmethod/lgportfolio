"use client";

import { useEffect, useState } from "react";

/** Dot plus text state from /api/health/live (process alive). Silent when the fetch fails. */
export default function LiveDot() {
  const [up, setUp] = useState(false);
  useEffect(() => {
    const ctl = new AbortController();
    fetch("/api/health/live", { signal: ctl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setUp(j?.status === "ok"))
      .catch(() => {});
    return () => ctl.abort();
  }, []);
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-soft" aria-live="polite">
      <span className={`size-2 rounded-full ${up ? "bg-live" : "bg-ink-soft/50"}`} aria-hidden />
      {up ? "Live" : ""}
    </span>
  );
}
