import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";

import { POST } from "@/app/api/analytics/page-view/route";
import { clearVisitorNotifyCache } from "@/lib/notify";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const CURL_UA = "curl/8.5.0";
const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const WEBHOOK_URL = "https://notify.example.com/webhooks/visitor-pings";

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
  vi.stubEnv("VISITOR_WEBHOOK_URL", WEBHOOK_URL);
  vi.stubEnv("VISITOR_WEBHOOK_SECRET", "test-secret");
  delete process.env.OWNER_IPS;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  clearVisitorNotifyCache();
});

describe("/api/analytics/page-view visitor pings", () => {
  it("person UA → one signed webhook call; same visitor again → zero calls (dedupe)", async () => {
    const res1 = await POST(makeRequest(CHROME_UA, "9.9.9.9"));
    expect(res1.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(WEBHOOK_URL);

    const opts = fetchMock.mock.calls[0][1] as {
      headers: Record<string, string>;
      body: string;
    };
    const sig = opts.headers["X-Hub-Signature-256"];
    expect(sig).toBe(
      "sha256=" + createHmac("sha256", "test-secret").update(opts.body).digest("hex")
    );
    const payload = JSON.parse(opts.body) as Record<string, string>;
    expect(payload.event_type).toBe("visitor-pageview");
    expect(payload.category).toBe("person");

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
    delete process.env.VISITOR_WEBHOOK_URL;
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

  it("payload carries only event type, category, path, country and timestamp (no IP, UA, or referrer)", async () => {
    const req = new Request("https://localhost:3000/api/analytics/page-view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": CHROME_UA,
        "X-Forwarded-For": "9.9.9.9",
        Referer: "https://example.org/some/page?q=1",
        "CF-IPCountry": "US",
      },
      body: JSON.stringify({ path: "/work" }),
    });
    await POST(req);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = (fetchMock.mock.calls[0][1] as { body: string }).body;
    const payload = JSON.parse(body) as Record<string, string>;
    expect(Object.keys(payload).sort()).toEqual(["category", "country", "event_type", "path", "timestamp"]);
    expect(payload.country).toBe("US");
    expect(body).not.toContain("9.9.9.9");
    expect(body).not.toContain("example.org");
    expect(body).not.toContain("Mozilla");
  });

  it("does not print the IP to the console or logs", async () => {
    const logSpy = vi.mocked(console.log);
    await POST(makeRequest(CHROME_UA, "9.9.9.9"));
    for (const call of logSpy.mock.calls) expect(JSON.stringify(call)).not.toContain("9.9.9.9");
  });
});
