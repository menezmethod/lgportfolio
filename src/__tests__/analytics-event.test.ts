import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/chat-store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/chat-store")>()),
  recordSiteEvent: vi.fn(async () => {}),
}));

import { POST } from "@/app/api/analytics/event/route";
import { recordSiteEvent } from "@/lib/chat-store";
import { clickEventFor } from "@/components/PageViewTracker";

const HUMAN =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const BOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const post = (body: unknown, ua = HUMAN) =>
  POST(new Request("http://localhost/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": ua },
    body: JSON.stringify(body),
  }));

beforeEach(() => vi.mocked(recordSiteEvent).mockClear());

describe("clickEventFor", () => {
  it("maps outbound links to event names", () => {
    expect(clickEventFor("https://gimenez.dev/Luis-Gimenez-Resume.pdf")).toBe("resume_download");
    expect(clickEventFor("https://github.com/menezmethod/inferencia")).toBe("github_click");
    expect(clickEventFor("https://www.linkedin.com/in/gimenezdev")).toBe("linkedin_click");
    expect(clickEventFor("mailto:luisgimenezdev@gmail.com")).toBe("email_click");
    expect(clickEventFor("https://gimenez.dev/cdn-cgi/l/email-protection#abc")).toBe("email_click");
    expect(clickEventFor("https://gimenez.dev/work")).toBeNull();
  });
});

describe("/api/analytics/event", () => {
  it("saves a click from a likely human", async () => {
    const res = await post({ name: "resume_download", path: "/contact" });
    expect(res.status).toBe(204);
    expect(recordSiteEvent).toHaveBeenCalledWith("resume_download", "/contact");
  });

  it("ignores bots, unknown names, page_view, and bad paths, and still returns 204", async () => {
    for (const [body, ua] of [
      [{ name: "resume_download", path: "/" }, BOT],
      [{ name: "drop_table", path: "/" }, HUMAN],
      [{ name: "page_view", path: "/" }, HUMAN],
      [{ name: "github_click", path: "https://evil.example" }, HUMAN],
    ] as const) {
      expect((await post(body, ua)).status).toBe(204);
    }
    expect(recordSiteEvent).not.toHaveBeenCalled();
  });
});
