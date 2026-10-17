import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isStorageConfigured,
  writeSessionSummary,
  getSessionMemory,
  listSessions,
  getBoardStats,
} from "@/lib/chat-store";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("chat-store", () => {
  it("is off without the worker key and never calls the worker", async () => {
    vi.stubEnv("CLOUDFLARE_RAG_KEY", "");
    expect(isStorageConfigured()).toBe(false);
    await writeSessionSummary({ sessionId: "s", rateLimited: false, status: "ok" });
    expect(await getSessionMemory("s")).toEqual([]);
    expect(await listSessions()).toEqual([]);
    expect(await getBoardStats()).toEqual({ sessions_last_n_days: 0, sessions_with_email: 0, events: {}, top_paths: [], sources: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the op to the worker /store route with the key", async () => {
    vi.stubEnv("CLOUDFLARE_RAG_KEY", "k");
    vi.stubEnv("CLOUDFLARE_RAG_WORKER_URL", "https://w.example/");
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ messages: [{ role: "user", content: "hi" }] })));
    expect(isStorageConfigured()).toBe(true);
    expect(await getSessionMemory("s1")).toEqual([{ role: "user", content: "hi" }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://w.example/store");
    expect(init.headers["x-rag-key"]).toBe("k");
    expect(JSON.parse(init.body)).toEqual({ op: "memory_get", session_id: "s1" });
  });

  it("throws on a worker error so callers can log it", async () => {
    vi.stubEnv("CLOUDFLARE_RAG_KEY", "k");
    fetchMock.mockResolvedValue(new Response("{}", { status: 502 }));
    await expect(listSessions()).rejects.toThrow("Chat store list failed: 502");
  });
});
