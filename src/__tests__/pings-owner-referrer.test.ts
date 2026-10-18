import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { POST as rawPOST } from "@/app/api/analytics/page-view/route";
import { GET as ownerGET } from "@/app/api/owner/route";
import { clearVisits, flushAllVisits } from "@/lib/visits";

const POST = async (req: Request) => {
  const res = await rawPOST(req);
  await flushAllVisits();
  return res;
};
import { isOwnerRequest, OWNER_COOKIE } from "@/lib/owner";
import { classifyVisitor, externalReferrer } from "@/lib/telemetry";

const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

let fetchMock: ReturnType<typeof vi.fn>;

const pageView = (body: Record<string, unknown>, headers: Record<string, string> = {}) =>
  POST(new Request("https://gimenez.dev/api/analytics/page-view", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": CHROME_UA, "X-Forwarded-For": "9.9.9.9", ...headers },
    body: JSON.stringify(body),
  }));

const pingBody = () => JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body) as Record<string, string>;

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
  clearVisits();
  vi.stubEnv("VISITOR_WEBHOOK_URL", "https://notify.example.com/webhooks/visitor-pings");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://gimenez.dev");
  vi.stubEnv("OWNER_KEY", "owner-test-key");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  clearVisits();
});

describe("externalReferrer", () => {
  it("keeps only the origin of another site", () => {
    expect(externalReferrer("https://www.linkedin.com/feed/?trk=abc", "gimenez.dev")).toBe("https://www.linkedin.com");
    expect(externalReferrer("https://gimenez.dev/work", "gimenez.dev")).toBe("");
    expect(externalReferrer("https://www.gimenez.dev/", "gimenez.dev")).toBe("");
    expect(externalReferrer("javascript:alert(1)", "gimenez.dev")).toBe("");
    expect(externalReferrer("not a url", "gimenez.dev")).toBe("");
    expect(externalReferrer(undefined, "gimenez.dev")).toBe("");
  });
});

describe("referrer in the ping", () => {
  it("is 'direct' when the browser sent no outside referrer, even though the Referer header is this site", async () => {
    await pageView({ path: "/" }, { Referer: "https://gimenez.dev/" });
    expect(pingBody().referrer).toBe("direct");
  });
  it("is the outside origin from document.referrer", async () => {
    await pageView({ path: "/", ref: "https://www.google.com/search?q=luis" });
    expect(pingBody().referrer).toBe("google.com");
  });
});

describe("bots, automation and link previews never ping", () => {
  it.each([
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse",
    "TelegramBot (like TwitterBot)",
    "WhatsApp/2.23.20.0",
    "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/13.6.0 Chrome/118.0.5993.159 Electron/27.1.3 Safari/537.36",
  ])("%s", async (ua) => {
    expect(classifyVisitor(ua)).not.toBe("person");
    await pageView({ path: "/" }, { "User-Agent": ua });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("owner cookie", () => {
  it("wrong or missing key: 404 and no cookie", async () => {
    for (const q of ["", "?key=nope"]) {
      const res = await ownerGET(new Request(`https://gimenez.dev/api/owner${q}`));
      expect(res.status).toBe(404);
      expect(res.headers.get("set-cookie")).toBeNull();
    }
  });

  it("right key sets an HttpOnly cookie that marks later requests as the owner's", async () => {
    const res = await ownerGET(new Request("https://gimenez.dev/api/owner?key=owner-test-key"));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") || "";
    expect(setCookie).toMatch(new RegExp(`^${OWNER_COOKIE}=[a-f0-9]{64};`));
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    const cookie = setCookie.split(";")[0];
    expect(isOwnerRequest(new Request("https://gimenez.dev/", { headers: { cookie } }))).toBe(true);
    expect(isOwnerRequest(new Request("https://gimenez.dev/", { headers: { cookie: `${OWNER_COOKIE}=${"0".repeat(64)}` } }))).toBe(false);
  });

  it("owner page views send no ping", async () => {
    const res = await ownerGET(new Request("https://gimenez.dev/api/owner?key=owner-test-key"));
    const cookie = (res.headers.get("set-cookie") || "").split(";")[0];
    const pv = await pageView({ path: "/" }, { cookie });
    expect(pv.status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no OWNER_KEY set: nobody is the owner", () => {
    vi.stubEnv("OWNER_KEY", "");
    expect(isOwnerRequest(new Request("https://gimenez.dev/", { headers: { cookie: `${OWNER_COOKIE}=${"a".repeat(64)}` } }))).toBe(false);
  });
});
