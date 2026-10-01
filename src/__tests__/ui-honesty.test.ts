import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("labels say what they measure", () => {
  const trace = read("src/components/site/TraceWaterfall.tsx");
  it("visitor row is page-load TTFB, not a chat POST", () => {
    expect(trace).toContain("Your browser, this page load (time to first byte)");
    expect(trace).not.toContain("POST /api/chat");
  });
  it("browser connection timing is not labelled as the proxy", () => {
    expect(trace).toContain('name: "Connection"');
    expect(trace).toContain("DNS + connect + TLS");
    expect(trace).not.toContain('name: "Cloudflare proxy"');
  });
  it("war room events wrap instead of truncating", () => {
    const wr = read("src/components/war-room/WarRoomDashboard.tsx");
    expect(wr).not.toMatch(/text-foreground truncate">\{ev\.message/);
  });
  it("page view tracker dedupes by last tracked path (StrictMode)", () => {
    const t = read("src/components/PageViewTracker.tsx");
    expect(t).toContain("lastPath.current === pathname");
  });

  it("privacy discloses the Cloudflare edge beacon and the theme localStorage key", () => {
    const priv = read("src/app/privacy/page.tsx");
    expect(priv).toContain("Cloudflare web analytics");
    expect(priv).toContain("may add its own web analytics beacon");
    expect(priv).toContain("sets no cookies");
    expect(priv).toContain("switch it off in Cloudflare");
    expect(priv).toContain('localStorage under the key \\"theme\\"');
  });

  it("war room neutral values and the memory badge use neutral ink, alarm colours only for real breaches", () => {
    const wr = read("src/components/war-room/WarRoomDashboard.tsx");
    expect(wr).toMatch(/label: `Requests \(\$\{win\}\)`[^\n]*color: 'text-foreground'/);
    expect(wr).toMatch(/label: `Cache Hit[^\n]*color: 'text-foreground'/);
    expect(wr).toMatch(/latency_p95 > 500 \? 'text-amber/);
    expect(wr).toContain("'bg-muted text-ink-soft border-hairline'");
    expect(wr).not.toMatch(/rate_limit_hits_24h > 0 \?/);
  });
});
