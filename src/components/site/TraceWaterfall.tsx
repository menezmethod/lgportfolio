"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Cloud, Globe, Layers, Search, Sparkles } from "lucide-react";
import type { WarRoomData } from "@/components/war-room/WarRoomDashboard";

type Key = "browser" | "edge" | "app" | "rag" | "inf";
type Spans = NonNullable<WarRoomData["chat_spans"]>;

/** The real chat request path of this site. Only retrieval and inference have timings. */
const ROWS: { key: Key; name: string; sub: string; Icon: typeof Globe }[] = [
  { key: "browser", name: "Visitor", sub: "Browser, POST /api/chat", Icon: Globe },
  { key: "edge", name: "Cloudflare proxy", sub: "DNS and proxy in front", Icon: Cloud },
  { key: "app", name: "Next.js app", sub: "Coolify, free-tier cloud VM", Icon: Layers },
  { key: "rag", name: "RAG retrieval", sub: "RAG worker, Vectorize", Icon: Search },
  { key: "inf", name: "Chat inference", sub: "RAG worker, Workers AI", Icon: Sparkles },
];

const MIN_P50 = 5;

function ago(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

export default function TraceWaterfall() {
  const reduce = useReducedMotion();
  const [spans, setSpans] = useState<Spans | null>(null);
  const [active, setActive] = useState<Key>("inf");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const ctl = new AbortController();
    fetch("/api/war-room/data", { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: WarRoomData | null) => j?.chat_spans && setSpans(j.chat_spans))
      .catch(() => {});
    return () => ctl.abort();
  }, []);

  // With 5 or more samples show the p50. With fewer, show the last real sample. With none, show the path only.
  const useP50 = !!spans && spans.samples >= MIN_P50;
  const have = !!spans && spans.samples >= 1 && !!spans.last;
  const rag = have ? (useP50 ? spans!.rag_p50_ms : spans!.last!.rag_ms) : 0;
  const inf = have ? (useP50 ? spans!.inference_p50_ms : spans!.last!.inference_ms) : 0;
  const total = Math.max(1, rag + inf);
  const note = have
    ? `${useP50 ? "p50" : "last sample"}, n=${spans!.samples}, sampled ${ago(now - spans!.last!.at)}`
    : "";

  if (!have) {
    return (
      <figure aria-label="Example trace of this site's chat request path">
        <div className="flex items-baseline justify-between gap-4">
          <p className="eyebrow">Example request path. This site.</p>
          <p className="text-right font-mono text-xs text-ink-soft">No measured timings yet</p>
        </div>
        <ol className="mt-5 border-y border-hairline">
          {ROWS.map(({ key, name, sub, Icon }) => (
            <li key={key} className="flex min-h-12 items-center gap-3 border-b border-hairline py-2 last:border-b-0">
              <Icon className="size-4 shrink-0 text-ink-soft" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{name}</span>
                <span className="block truncate text-xs leading-tight text-ink-soft">{sub}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 font-mono text-xs text-ink-soft">Timings appear after the first chat request since the last restart.</p>
        <figcaption className="mt-3 text-sm leading-snug text-ink-soft">
          This site&apos;s own request path. Real timings will show here from the{" "}
          <Link href="/war-room" className="link-under text-foreground">War Room</Link> data.
        </figcaption>
      </figure>
    );
  }

  return (
    <figure aria-label="Trace of this site's chat request path">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">Real request. This site.</p>
        <p className="text-right font-mono text-xs text-ink-soft" aria-live="polite">{note}</p>
      </div>

      <ol className="mt-5 border-y border-hairline">
        {ROWS.map(({ key, name, sub, Icon }, i) => {
          const measured = (key === "rag" || key === "inf");
          const isActive = active === key;
          const left = key === "inf" ? (rag / total) * 100 : 0;
          const width = key === "rag" ? Math.max(3, (rag / total) * 100) : key === "inf" ? Math.max(3, (inf / total) * 100) : 0;
          return (
            <li key={key} className="border-b border-hairline last:border-b-0">
              <button
                type="button"
                onClick={() => setActive(key)}
                onFocus={() => setActive(key)}
                onMouseEnter={() => setActive(key)}
                aria-pressed={isActive}
                className="grid min-h-12 w-full grid-cols-[minmax(0,40%)_minmax(0,1fr)_84px] items-center gap-3 py-2 text-left sm:grid-cols-[minmax(0,36%)_minmax(0,1fr)_96px]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className={`size-4 shrink-0 ${isActive ? "text-brand-text" : "text-ink-soft"}`} aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{name}</span>
                    <span className="block truncate text-xs leading-tight text-ink-soft">{sub}</span>
                  </span>
                </span>
                <span className="relative block h-3 border-x border-dashed border-hairline" aria-hidden>
                    {measured && (
                      <motion.span
                        className="absolute top-1/2 block h-[6px] -translate-y-1/2 origin-left rounded-full"
                        style={{ left: `${left}%`, width: `${width}%`, background: isActive ? "var(--brand)" : "var(--ink-soft)" }}
                        initial={reduce ? false : { scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : i * 0.08, ease: [0.2, 0.7, 0.2, 1] }}
                      />
                    )}
                  </span>
                <span className={`whitespace-nowrap text-right font-mono text-xs ${isActive && measured ? "text-brand-text" : "text-ink-soft"}`}>
                  {key === "rag" ? `${rag} ms` : key === "inf" ? `${inf} ms` : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 font-mono text-xs text-ink-soft">
        {`Measured total ${rag + inf} ms`}
      </p>
      <figcaption className="mt-3 text-sm leading-snug text-ink-soft">
        This site&apos;s own request path. Real timings from the{" "}
        <Link href="/war-room" className="link-under text-foreground">War Room</Link>.
      </figcaption>
    </figure>
  );
}
