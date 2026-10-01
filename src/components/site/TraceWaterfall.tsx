"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Cloud, Globe, Layers, Search, Sparkles } from "lucide-react";
import type { WarRoomData } from "@/components/war-room/WarRoomDashboard";

type Key = "browser" | "edge" | "app" | "rag" | "inf";

interface Row {
  key: Key;
  name: string;
  sub: string;
  Icon: typeof Globe;
  /** Measured milliseconds, or null when nothing real exists. */
  ms: number | null;
  /** Where the number comes from, shown under the row. */
  note: string;
}

const MIN_P50 = 5;

function ago(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

/** This visitor's own page-load timings from the Navigation Timing API. */
function readNavigation(): { ttfb: number; connect: number } | null {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!nav || !nav.responseStart) return null;
    return {
      ttfb: Math.round(nav.responseStart - nav.startTime),
      connect: Math.round(Math.max(0, nav.connectEnd - nav.domainLookupStart)),
    };
  } catch {
    return null;
  }
}

type Spans = NonNullable<WarRoomData["chat_spans"]>;

function spanRow(
  which: "rag" | "inf",
  spans: Spans | null,
  now: number,
): { ms: number | null; note: string } {
  if (!spans) return { ms: null, note: "not available" };
  const chatMs = (use: "p50" | "last") =>
    which === "rag"
      ? use === "p50" ? spans.rag_p50_ms : spans.last?.rag_ms ?? 0
      : use === "p50" ? spans.inference_p50_ms : spans.last?.inference_ms ?? 0;
  if (spans.samples >= MIN_P50 && spans.last) {
    return { ms: chatMs("p50"), note: `from visitor chats, p50, n=${spans.samples}, sampled ${ago(now - spans.last.at)}` };
  }
  if (spans.samples >= 1 && spans.last) {
    return { ms: chatMs("last"), note: `from visitor chats, last sample, n=${spans.samples}, sampled ${ago(now - spans.last.at)}` };
  }
  const p = which === "rag" ? spans.probe?.rag : spans.probe?.inference;
  if (p) return { ms: p.ms, note: `from a scheduled probe, n=1, sampled ${ago(now - p.at)}` };
  const configured = which === "rag" ? spans.probe?.rag_configured : spans.probe?.inference_configured;
  return { ms: null, note: configured ? "not available yet, a probe runs shortly" : "not available" };
}

export default function TraceWaterfall() {
  const reduce = useReducedMotion();
  const [data, setData] = useState<WarRoomData | null>(null);
  const [failed, setFailed] = useState(false);
  const [nav, setNav] = useState<{ ttfb: number; connect: number } | null>(null);
  const [active, setActive] = useState<Key>("rag");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Navigation timing is ready after load.
    const read = () => setNav(readNavigation());
    if (document.readyState === "complete") read();
    else window.addEventListener("load", read, { once: true });
    return () => window.removeEventListener("load", read);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/war-room/data", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
        .then((j: WarRoomData) => {
          if (!alive) return;
          setData(j);
          setFailed(false);
          setNow(Date.now());
        })
        .catch(() => alive && setFailed(true));
    load();
    // A probe may finish a few seconds after the first request, so refresh a little later and then slowly.
    const first = setTimeout(load, 20000);
    const every = setInterval(load, 60000);
    return () => {
      alive = false;
      clearTimeout(first);
      clearInterval(every);
    };
  }, []);

  if (failed && !data) {
    return (
      <figure aria-label="Trace of this site's request path">
        <p className="eyebrow">Request path. This site.</p>
        <p className="mt-3 text-sm text-ink-soft">Timings unavailable right now.</p>
      </figure>
    );
  }

  const spans = data?.chat_spans ?? null;
  const rag = spanRow("rag", spans, now);
  const inf = spanRow("inf", spans, now);
  const rm = data?.request_metrics;
  const appMs = rm && rm.total_24h > 0 ? rm.latency_p50 : null;

  const rows: Row[] = [
    {
      key: "browser", name: "Visitor", sub: "Browser, POST /api/chat", Icon: Globe,
      ms: nav ? nav.ttfb : null,
      note: nav ? "time to first byte, your browser, this page load" : "not available in this browser",
    },
    {
      key: "edge", name: "Cloudflare proxy", sub: "DNS and proxy in front", Icon: Cloud,
      ms: nav ? nav.connect : null,
      note: nav ? (nav.connect === 0 ? "connection reused, your browser, this page load" : "DNS and connect, your browser, this page load") : "not available in this browser",
    },
    {
      key: "app", name: "Next.js app", sub: "Coolify, free-tier cloud VM", Icon: Layers,
      ms: appMs,
      note: appMs !== null && rm ? `p50 of server request durations, ${rm.total_24h} requests counted` : "not available yet",
    },
    { key: "rag", name: "RAG retrieval", sub: "RAG worker, Vectorize", Icon: Search, ms: rag.ms, note: rag.note },
    { key: "inf", name: "Chat inference", sub: "RAG worker, Workers AI, to first token", Icon: Sparkles, ms: inf.ms, note: inf.note },
  ];
  const max = Math.max(1, ...rows.map((r) => r.ms ?? 0));

  return (
    <figure aria-label="Trace of this site's request path">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">Real request path. This site.</p>
        <p className="text-right font-mono text-xs text-ink-soft">Each row is measured separately</p>
      </div>

      <ol className="mt-5 border-y border-hairline">
        {rows.map((r, i) => {
          const isActive = active === r.key;
          return (
            <li key={r.key} className="border-b border-hairline last:border-b-0">
              <button
                type="button"
                onClick={() => setActive(r.key)}
                onFocus={() => setActive(r.key)}
                onMouseEnter={() => setActive(r.key)}
                aria-pressed={isActive}
                className="grid min-h-12 w-full grid-cols-[minmax(0,40%)_minmax(0,1fr)_84px] items-center gap-3 py-2 text-left sm:grid-cols-[minmax(0,36%)_minmax(0,1fr)_96px]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <r.Icon className={`size-4 shrink-0 ${isActive ? "text-brand-text" : "text-ink-soft"}`} aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{r.name}</span>
                    <span className="block truncate text-xs leading-tight text-ink-soft">{r.sub}</span>
                  </span>
                </span>
                <span className="relative block h-3 border-x border-dashed border-hairline" aria-hidden>
                  {r.ms !== null && (
                    <motion.span
                      className="absolute left-0 top-1/2 block h-[6px] -translate-y-1/2 origin-left rounded-full"
                      style={{ width: `${Math.max(2, (r.ms / max) * 100)}%`, background: isActive ? "var(--brand)" : "var(--ink-soft)" }}
                      initial={reduce ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : i * 0.08, ease: [0.2, 0.7, 0.2, 1] }}
                    />
                  )}
                </span>
                <span className={`whitespace-nowrap text-right font-mono text-xs ${isActive && r.ms !== null ? "text-brand-text" : "text-ink-soft"}`}>
                  {r.ms === null ? "n/a" : r.ms === 0 ? "<1 ms" : `${r.ms} ms`}
                </span>
              </button>
              {isActive && <p className="-mt-1 pb-2 pl-7 font-mono text-xs leading-snug text-ink-soft">{r.note}</p>}
            </li>
          );
        })}
      </ol>

      <figcaption className="mt-3 text-sm leading-snug text-ink-soft">
        This site&apos;s own request path, with real timings from your browser and the{" "}
        <Link href="/war-room" className="link-under text-foreground">War Room</Link> data. Rows without a sample say so.
      </figcaption>
    </figure>
  );
}
