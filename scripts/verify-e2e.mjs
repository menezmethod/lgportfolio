#!/usr/bin/env node
// End-to-end check of the visitor-presence webhook. No secrets: it uses a throwaway test secret.
// It starts a local receiver that verifies the HMAC signature, starts the app against it (or targets
// BASE_URL, which must already run with the same VISITOR_WEBHOOK_URL/SECRET/OWNER_IPS), then drives
// POST /api/analytics/page-view with several visitors and prints PASS/FAIL per case.
//   node scripts/verify-e2e.mjs                      # starts `next dev` on a free port
//   BASE_URL=http://localhost:3000 RECEIVER_PORT=4999 node scripts/verify-e2e.mjs   # app already running
import http from "node:http";
import net from "node:net";
import { createHmac, timingSafeEqual } from "node:crypto";
import { spawn } from "node:child_process";

const SECRET = "test";
const OWNER_IP = "203.0.113.9";
const received = [];

const freePort = () =>
  new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

const receiverPort = Number(process.env.RECEIVER_PORT) || (await freePort());
const receiver = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const sig = String(req.headers["x-hub-signature-256"] || "");
    const expected = "sha256=" + createHmac("sha256", SECRET).update(body).digest("hex");
    const valid = sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    received.push({ valid, body: JSON.parse(body || "{}") });
    res.writeHead(200).end("ok");
  });
});
await new Promise((r) => receiver.listen(receiverPort, r));

let app = null;
let base = process.env.BASE_URL;
if (!base) {
  const port = await freePort();
  base = `http://localhost:${port}`;
  app = spawn("npx", ["next", "dev", "-p", String(port)], {
    env: {
      ...process.env,
      VISITOR_WEBHOOK_URL: `http://localhost:${receiverPort}/hook`,
      VISITOR_WEBHOOK_SECRET: SECRET,
      OWNER_IPS: OWNER_IP,
    },
    stdio: "ignore",
  });
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(base + "/api/health/live")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
}

const BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const LINKEDIN = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 LinkedInApp/9.30";
const BOT = "curl/8.5.0";

const visit = (ua, ip, path = "/", referer = "https://example.org/x") =>
  fetch(base + "/api/analytics/page-view", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": ua, "x-forwarded-for": ip, referer, "cf-ipcountry": "US" },
    body: JSON.stringify({ path }),
  });

const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`);
};
const settle = () => new Promise((r) => setTimeout(r, 700));

let n = received.length;
await visit(BROWSER, "198.51.100.7", "/work");
await settle();
const first = received.slice(n);
check("browser UA sends exactly one ping", first.length === 1, `pings=${first.length}`);
check("ping signature verifies with the test secret", first[0]?.valid === true);
check(
  "ping carries category person, path, referrer, uaSummary, ip, country",
  first[0]?.body.category === "person" && first[0]?.body.path === "/work" && first[0]?.body.referrer === "https://example.org/x" && first[0]?.body.uaSummary === "Chrome" && first[0]?.body.ip === "198.51.100.7" && first[0]?.body.country === "US" && first[0]?.body.event_type === "visitor-pageview",
  JSON.stringify(first[0]?.body),
);

n = received.length;
await visit(BROWSER, "198.51.100.7", "/about");
await settle();
check("same visitor again is deduped (no ping)", received.length === n);

n = received.length;
await visit(BOT, "198.51.100.20");
await settle();
check("bot UA (curl) sends no ping", received.length === n);

n = received.length;
await visit("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "198.51.100.21");
await settle();
check("crawler UA (Googlebot) sends no ping", received.length === n);

n = received.length;
await visit(BROWSER, OWNER_IP);
await settle();
check("owner IP (OWNER_IPS) sends no ping", received.length === n);

n = received.length;
await visit(LINKEDIN, "198.51.100.8", "/");
await settle();
const li = received.slice(n);
check("LinkedIn-app UA sends a ping with category recruiter", li.length === 1 && li[0].body.category === "recruiter" && li[0].valid, `category=${li[0]?.body.category}`);

receiver.close();
if (app) app.kill("SIGTERM");
const failed = results.filter((r) => !r).length;
console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
