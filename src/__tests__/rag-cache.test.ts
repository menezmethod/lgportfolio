import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { KNOWLEDGE_BASE } from "@/lib/knowledge";
import { retrieveContext, resetRetrievalCache } from "@/lib/rag";
import { getDailyBudgetStats, checkRateLimit } from "@/lib/rate-limit";

const CURRENT = KNOWLEDGE_BASE.split("\n").find((l) => l.startsWith("- Alert quality:"))!.trim();
const ok = () =>
  ({ ok: true, status: 200, json: async () => ({ matches: [{ score: 0.6, source: "knowledge", content: CURRENT }] }) }) as unknown as Response;
const original = global.fetch;

beforeEach(() => {
  resetRetrievalCache();
  global.fetch = vi.fn().mockResolvedValue(ok());
  vi.stubEnv("CLOUDFLARE_RAG_KEY", "k");
});
afterEach(() => {
  global.fetch = original;
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("retrieval cache", () => {
  it("miss then hit: the worker is called once for a repeated question (case and spacing normalized)", async () => {
    const a = await retrieveContext("How does Luis handle alert quality?");
    const b = await retrieveContext("  how does luis   handle ALERT quality?  ");
    expect(b).toBe(a);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("a different question is a miss", async () => {
    await retrieveContext("How does Luis handle alert quality?");
    await retrieveContext("What roles is Luis looking for in platform engineering?");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("entries expire after 10 minutes", async () => {
    vi.useFakeTimers();
    await retrieveContext("How does Luis handle alert quality?");
    vi.advanceTimersByTime(9 * 60_000);
    await retrieveContext("How does Luis handle alert quality?");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2 * 60_000);
    await retrieveContext("How does Luis handle alert quality?");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("failures are never cached", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("down")).mockResolvedValue(ok());
    await retrieveContext("How does Luis handle alert quality?"); // falls back to file context
    await retrieveContext("How does Luis handle alert quality?");
    expect(global.fetch).toHaveBeenCalledTimes(2);
    await retrieveContext("How does Luis handle alert quality?"); // now cached
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("an answered-but-empty lookup (only stale or low-score chunks) is cached too, since the worker did answer", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      ({ ok: true, status: 200, json: async () => ({ matches: [{ score: 0.9, source: "old", content: "text that is no longer in the knowledge base" }] }) }) as unknown as Response
    );
    await retrieveContext("How does Luis handle alert quality?");
    await retrieveContext("How does Luis handle alert quality?");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("holds about 200 entries, evicting the oldest", async () => {
    for (let i = 0; i < 201; i++) await retrieveContext(`Distinct question number ${i} about payments`);
    expect(global.fetch).toHaveBeenCalledTimes(201);
    await retrieveContext("Distinct question number 200 about payments"); // newest still cached
    expect(global.fetch).toHaveBeenCalledTimes(201);
    await retrieveContext("Distinct question number 0 about payments"); // evicted
    expect(global.fetch).toHaveBeenCalledTimes(202);
  });

  it("does not change rate-limit or budget accounting", async () => {
    const before = getDailyBudgetStats().used;
    await retrieveContext("How does Luis handle alert quality?");
    await retrieveContext("How does Luis handle alert quality?");
    expect(getDailyBudgetStats().used).toBe(before);
    const ip = "198.51.100.9";
    const first = checkRateLimit(ip);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(5);
  });
});
