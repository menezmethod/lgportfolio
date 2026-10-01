import { describe, it, expect } from "vitest";
import { spanView, formatMs, agoLabel, type TraceSpans } from "@/lib/trace-rows";

const NOW = 1_000_000_000_000;
const min = (n: number) => n * 60_000;
const spans = (over: Partial<TraceSpans> = {}): TraceSpans => ({
  samples: 3,
  rag_p50_ms: 400,
  inference_p50_ms: 818,
  last: { at: NOW - min(120), rag_ms: 380, inference_ms: 25_410 },
  probe: { rag: { at: NOW - min(5), ms: 410 }, inference: { at: NOW - min(5), ms: 1_276 }, rag_configured: true, inference_configured: true },
  ...over,
});

describe("trace row values", () => {
  it("formats thousands and long durations", () => {
    expect(formatMs(25_410)).toBe("25.4 s");
    expect(formatMs(1_276)).toBe("1,276 ms");
    expect(formatMs(818)).toBe("818 ms");
    expect(formatMs(0)).toBe("<1 ms");
    expect(agoLabel(min(120))).toBe("2 h ago");
  });

  it("the live case: a stale 25 s outlier does not become the headline; the fresher probe does", () => {
    const v = spanView("inf", spans(), NOW);
    expect(v.ms).toBe(1_276);
    expect(v.note).toContain("scheduled probe");
    expect(v.note).toContain("5 min ago");
  });

  it("with no newer probe, the headline is the median and the outlier is named, flagged, with age", () => {
    const v = spanView("inf", spans({ probe: undefined }), NOW);
    expect(v.ms).toBe(818);
    expect(v.outlier).toBe(true);
    expect(v.stale).toBe(true);
    expect(v.note).toContain("median, n=3");
    expect(v.note).toContain("2 h ago (stale)");
    expect(v.note).toContain("Last: 25.4 s, outlier");
  });

  it("a fresh chat newer than the probe gives the median with n and age, no outlier text", () => {
    const v = spanView("rag", spans({ last: { at: NOW - min(1), rag_ms: 420, inference_ms: 900 }, probe: { rag: { at: NOW - min(30), ms: 410 }, inference: null, rag_configured: true, inference_configured: true } }), NOW);
    expect(v.ms).toBe(400);
    expect(v.note).toBe("median, n=3, 1 min ago");
    expect(v.outlier).toBe(false);
  });

  it("probe only: n=1 with age; stale probes are labelled", () => {
    const v = spanView("rag", spans({ samples: 0, last: null, probe: { rag: { at: NOW - min(90), ms: 500 }, inference: null, rag_configured: true, inference_configured: true } }), NOW);
    expect(v).toMatchObject({ ms: 500, stale: true });
    expect(v.note).toContain("n=1");
    expect(v.note).toContain("(stale)");
  });

  it("no data says so; configured says a probe is coming", () => {
    expect(spanView("inf", null, NOW).ms).toBeNull();
    expect(spanView("inf", spans({ samples: 0, last: null, probe: { rag: null, inference: null, rag_configured: true, inference_configured: true } }), NOW).note).toContain("probe runs shortly");
  });
});
