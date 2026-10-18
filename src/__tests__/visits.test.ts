import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/chat-store", () => ({
  lookupApplication: vi.fn(async (src: string) =>
    src === "astra"
      ? { src: "astra", company: "Astra", role: "Senior Platform Engineer", applied_at: "2026-09-10", status: "Applied" }
      : null
  ),
}));

import {
  IDLE_MS,
  clearVisits,
  describeDevice,
  recordClick,
  recordLeave,
  recordPageVisit,
  recordQuestion,
  type VisitContext,
} from "@/lib/visits";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ctx: VisitContext = {
  ip: "9.9.9.9", userAgent: IPHONE, category: "recruiter",
  country: "US", region: "Florida", city: "Tampa", network: "Comcast Cable",
};

let fetchMock: ReturnType<typeof vi.fn>;
const sent = () => fetchMock.mock.calls.map((c) => JSON.parse((c[1] as { body: string }).body) as Record<string, string>);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-18T12:00:00Z"));
  vi.spyOn(console, "log").mockImplementation(() => {});
  fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("VISITOR_WEBHOOK_URL", "https://notify.example.com/webhooks/visitor-pings");
  clearVisits();
});

afterEach(() => {
  clearVisits();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("describeDevice", () => {
  it("names browser and device", () => {
    expect(describeDevice(IPHONE)).toBe("Safari on iPhone (iOS)");
    expect(describeDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36")).toBe("Chrome on Mac");
    expect(describeDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0")).toBe("Firefox on Windows");
    expect(describeDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36")).toBe("Chrome on Android phone");
  });
});

describe("visit digest", () => {
  it("sends nothing while the visit is active, then ONE digest after 30 idle minutes", async () => {
    await recordPageVisit(ctx, "/", "https://www.linkedin.com", "astra");
    await vi.advanceTimersByTimeAsync(40_000);
    await recordPageVisit(ctx, "/work/deployment-path", "", null);
    await vi.advanceTimersByTimeAsync(190_000);
    await recordPageVisit(ctx, "/contact", "", null);
    recordLeave(ctx, "/contact", 25_000);
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(IDLE_MS - 1);
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [d] = sent();
    expect(d.event_type).toBe("visitor-digest");
    expect(d.intent).toBe("high");
    expect(d.application).toBe("Astra");
    expect(d.path).toBe("/");
    expect(d.referrer).toBe("linkedin.com");
    expect(d.text).toBe(
      [
        "HIGH intent visit, 3m50s, 3 pages — Astra",
        "Application: Astra, Senior Platform Engineer (applied 2026-09-10, Applied)",
        "From: linkedin.com · src=astra",
        "Who: recruiter · Safari on iPhone (iOS) · Tampa, Florida, US · Comcast Cable",
        "Pages: / (40s) → /work/deployment-path (3m10s) → /contact (25s)",
        "Started 2026-10-18T12:00:00.000Z",
      ].join("\n")
    );
  });

  it("resume download alerts at once, only once per visit, and still ends with a digest", async () => {
    await recordPageVisit(ctx, "/contact", "", "astra");
    await recordClick(ctx, "resume_download");
    await recordClick(ctx, "resume_download");
    expect(sent().map((m) => m.event_type)).toEqual(["visitor-alert"]);
    expect(sent()[0].text).toContain("NOW: resume downloaded — Astra");

    await vi.advanceTimersByTimeAsync(IDLE_MS);
    expect(sent().map((m) => m.event_type)).toEqual(["visitor-alert", "visitor-digest"]);
    expect(sent()[1].text).toContain("Clicks: resume_download");
  });

  it("a chat question alerts only for src-tagged visits; the digest quotes it", async () => {
    await recordPageVisit(ctx, "/chat", "", null);
    await recordQuestion(ctx, "Has he   led a platform team?");
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(IDLE_MS);
    expect(sent()[0].text).toContain('Chat: "Has he led a platform team?"');
    expect(sent()[0].intent).toBe("high");

    fetchMock.mockClear();
    await recordPageVisit({ ...ctx, ip: "8.8.8.8" }, "/chat", "", "astra");
    await recordQuestion({ ...ctx, ip: "8.8.8.8" }, "What is his on-call experience?");
    expect(sent().map((m) => m.event_type)).toEqual(["visitor-alert"]);
  });

  it("a short direct visit is low intent; unknown src says so", async () => {
    await recordPageVisit({ ...ctx, ip: "7.7.7.7" }, "/", "", "zzz-unknown");
    await vi.advanceTimersByTimeAsync(IDLE_MS);
    expect(sent()[0].intent).toBe("low");
    expect(sent()[0].text).toContain("Application: src=zzz-unknown (no matching application)");
  });

  it("OWNER_IPS never sends", async () => {
    vi.stubEnv("OWNER_IPS", "9.9.9.9");
    await recordPageVisit(ctx, "/", "", null);
    await recordClick(ctx, "resume_download");
    await vi.advanceTimersByTimeAsync(IDLE_MS);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
