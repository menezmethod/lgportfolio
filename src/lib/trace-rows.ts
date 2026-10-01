/** Pure helpers for the home page trace: what number a row shows, and the honest caption under it. */

export interface TraceSpans {
  samples: number;
  rag_p50_ms: number;
  inference_p50_ms: number;
  last: { at: number; rag_ms: number; inference_ms: number; model?: string } | null;
  probe?: {
    rag: { at: number; ms: number } | null;
    inference: { at: number; ms: number; model?: string } | null;
    rag_configured: boolean;
    inference_configured: boolean;
  };
}

export const STALE_MS = 60 * 60 * 1000;
export const OUTLIER_FACTOR = 3;

/** 1,276 ms below 10 s, 25.4 s from 10 s up; <1 ms for zero. */
export function formatMs(ms: number): string {
  if (ms === 0) return "<1 ms";
  if (ms >= 10_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${ms.toLocaleString("en-US")} ms`;
}

export function agoLabel(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

export interface SpanView {
  ms: number | null;
  note: string;
  stale: boolean;
  /** A recent single sample far above the median, shown in words only, never as the headline bar. */
  outlier: boolean;
}

/**
 * Headline = median of real chat samples, or the freshest probe when it is newer than the last chat (or there
 * are no chats). A lone sample more than 3x the median is named in the note instead of being the headline.
 */
export function spanView(which: "rag" | "inf", spans: TraceSpans | null, now: number): SpanView {
  if (!spans) return { ms: null, note: "not available", stale: false, outlier: false };
  const p50 = which === "rag" ? spans.rag_p50_ms : spans.inference_p50_ms;
  const lastMs = spans.last ? (which === "rag" ? spans.last.rag_ms : spans.last.inference_ms) : null;
  const probe = which === "rag" ? spans.probe?.rag : spans.probe?.inference;
  const probeNewer = probe && (!spans.last || probe.at > spans.last.at);

  if (spans.samples >= 1 && spans.last && !probeNewer) {
    const age = now - spans.last.at;
    const stale = age > STALE_MS;
    const outlier = lastMs !== null && p50 > 0 && lastMs > OUTLIER_FACTOR * p50;
    let note = `median, n=${spans.samples}, ${agoLabel(age)}${stale ? " (stale)" : ""}`;
    if (outlier && lastMs !== null) note += `. Last: ${formatMs(lastMs)}, outlier (over ${OUTLIER_FACTOR}x the median)`;
    return { ms: p50, note, stale, outlier };
  }
  if (probe) {
    const age = now - probe.at;
    const stale = age > STALE_MS;
    const outlier = spans.samples >= 1 && p50 > 0 && probe.ms > OUTLIER_FACTOR * p50;
    return {
      ms: probe.ms,
      note: `scheduled probe, n=1, ${agoLabel(age)}${stale ? " (stale)" : ""}${outlier ? `, over ${OUTLIER_FACTOR}x the chat median` : ""}`,
      stale,
      outlier,
    };
  }
  const configured = which === "rag" ? spans.probe?.rag_configured : spans.probe?.inference_configured;
  return { ms: null, note: configured ? "not available yet, a probe runs shortly" : "not available", stale: false, outlier: false };
}
