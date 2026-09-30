import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { POST } from "@/app/api/analytics/page-view/route";
import { clearVisitorNotifyCache } from "@/lib/notify";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const CURL_UA = "curl/8.5.0";
const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

function makeRequest(ua: string, ip?: string): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (ua) headers["User-Agent"] = ua;
  if (ip) headers["X-Forwarded-For"] = ip;
  return new Request("https://localhost:3000/api/analytics/page-view", {
    method: "POST",
    headers,
    body: JSON.stringify({ path: "/" }),
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
  clearVisitorNotifyCache();
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
  vi.stubEnv("TELEGRAM_CHAT_ID", "12345");
  delete process.env.VISITOR_WEBHOOK_URL;
  delete process.env.OWNER_IPS;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  clearVisitorNotifyCache();
});

describe("/api/analytics/page-view visitor pings", () => {
  it("person UA → one Telegram call; same visitor again → zero calls (dedupe)", async () => {
    const res1 = await POST(makeRequest(CHROME_UA, "9.9.9.9"));
    expect(res1.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("api.telegram.org");
    expect(url).toContain("/sendMessage");

    const res2 = await POST(makeRequest(CHROME_UA, "9.9.9.9"));
    expect(res2.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("curl UA → zero calls", async () => {
    const res = await POST(makeRequest(CURL_UA, "9.9.9.9"));
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Googlebot UA → zero calls", async () => {
    const res = await POST(makeRequest(GOOGLEBOT_UA, "9.9.9.9"));
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("empty UA → zero calls", async () => {
    const res = await POST(makeRequest("", "9.9.9.9"));
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no env set → zero calls, no throw", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    const res = await POST(makeRequest(CHROME_UA, "9.9.9.9"));
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetch rejects → route still returns 200", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    const res = await POST(makeRequest(CHROME_UA, "9.9.9.9"));
    expect(res.status).toBe(200);
  });

  it("OWNER_IPS matching IP never pings", async () => {
    vi.stubEnv("OWNER_IPS", "1.2.3.4, 5.6.7.8");
    const res = await POST(makeRequest(CHROME_UA, "5.6.7.8"));
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("non-owner IP still pings when OWNER_IPS is set", async () => {
    vi.stubEnv("OWNER_IPS", "1.2.3.4");
    const res = await POST(makeRequest(CHROME_UA, "9.9.9.9"));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
