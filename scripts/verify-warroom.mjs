#!/usr/bin/env node
// Proves the War Room Prometheus path end to end with a tiny fake Prometheus (no real server needed).
// It answers /api/v1/query and /api/v1/query_range for the exact queries src/lib/war-room-metrics.ts makes,
// starts the app against it, and checks /api/war-room/data in three modes:
//   1. PROMETHEUS_URL unset       -> metrics_source "memory", prometheus check "not_configured"
//   2. PROMETHEUS_URL unreachable -> metrics_source "memory", prometheus check "unreachable"
//   3. PROMETHEUS_URL = fake      -> metrics_source "prometheus", values match what the fake returned
// Usage: node scripts/verify-warroom.mjs
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";

const freePort = () =>
  new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

// Instant query answers, keyed by a distinctive substring of the PromQL.
const INSTANT = [
  ["100 * (1 -", 99.9],
  ["chat_inference_duration_seconds", 1.2],
  ['sum(increase(http_requests_total[24h]))', 4321],
  ["rate(http_requests_total[1m])", 7],
  ['errors_total{type="server"}[1h]', 2],
  ["increase(http_requests_total[1h])", 400],
  ['quantile="0.5"', 0.045],
  ['quantile="0.95"', 0.31],
  ['quantile="0.99"', 0.9],
  ["chat_conversations_total[24h]", 12],
  ["max(chat_daily_budget_used)", 5],
  ["chat_cache_hits_total[24h]", 3],
  ["chat_rate_limit_hits_total[24h]", 1],
  ["app_cold_starts_total[24h]", 2],
];

const fake = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const q = url.searchParams.get("query") ?? "";
  res.setHeader("content-type", "application/json");
  if (url.pathname === "/api/v1/query") {
    if (q === "1") return res.end(JSON.stringify({ status: "success", data: { resultType: "scalar", result: [Date.now() / 1000, "1"] } }));
    // First match wins, so the most specific queries are listed first.
    const hit = INSTANT.find(([k]) => q.includes(k));
    if (!hit) return res.end(JSON.stringify({ status: "success", data: { resultType: "vector", result: [] } }));
    return res.end(JSON.stringify({ status: "success", data: { resultType: "vector", result: [{ metric: {}, value: [Date.now() / 1000, String(hit[1])] }] } }));
  }
  if (url.pathname === "/api/v1/query_range") {
    const end = Number(url.searchParams.get("end"));
    const v = q.includes('quantile="0.5"') ? 0.04 : q.includes('quantile="0.95"') ? 0.3 : q.includes("errors_total") ? 0 : 6;
    const values = [4, 3, 2, 1, 0].map((i) => [end - i * 60, String(v)]);
    return res.end(JSON.stringify({ status: "success", data: { resultType: "matrix", result: [{ metric: {}, values }] } }));
  }
  res.statusCode = 404;
  res.end("{}");
});
const fakePort = await freePort();
await new Promise((r) => fake.listen(fakePort, r));

async function withApp(extraEnv, fn) {
  const port = await freePort();
  const env = { ...process.env, ...extraEnv, VISITOR_WEBHOOK_URL: "http://127.0.0.1:9/none", FIREBASE_SERVICE_ACCOUNT_JSON: "" };
  if (!("PROMETHEUS_URL" in extraEnv)) delete env.PROMETHEUS_URL;
  const child = spawn("npx", ["next", "dev", "-p", String(port)], { env, stdio: "ignore", detached: true });
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(base + "/api/health/live")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  try {
    return await fn(base);
  } finally {
    try { process.kill(-child.pid, "SIGTERM"); } catch {}
    await new Promise((r) => setTimeout(r, 1500));
  }
}

const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`);
};
const get = async (base) => (await fetch(base + "/api/war-room/data")).json();

await withApp({}, async (base) => {
  // Memory mode: 60 good requests plus 10 client errors (400/429) must not move the server-error SLO or availability.
  for (let i = 0; i < 60; i++) await fetch(base + "/api/health/live");
  for (let i = 0; i < 10; i++) await fetch(base + "/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  const d = await get(base);
  const m = Object.fromEntries(d.slos.map((x) => [x.name, x]));
  check("memory: 4xx do not move Server Error Rate (0, met)", m["Server Error Rate"]?.current === 0 && m["Server Error Rate"]?.met, JSON.stringify(m["Server Error Rate"]));
  check("memory: Availability measured at 100 from 5xx, not hardcoded", m.Availability?.current === 100 && m.Availability?.met, JSON.stringify(m.Availability));
  check("memory: server errors tile agrees (0)", d.request_metrics.error_rate_1h === 0, String(d.request_metrics.error_rate_1h));
  check("unset: metrics_source is memory", d.metrics_source === "memory", d.metrics_source);
  check("unset: prometheus tile is not_configured", d.service_status.checks.prometheus.status === "not_configured");
});

await withApp({ PROMETHEUS_URL: "http://127.0.0.1:9" }, async (base) => {
  const d = await get(base);
  check("unreachable: falls back to memory", d.metrics_source === "memory", d.metrics_source);
  check("unreachable: prometheus tile is unreachable (neutral, not down)", d.service_status.checks.prometheus.status === "unreachable");
});

await withApp({ PROMETHEUS_URL: `http://127.0.0.1:${fakePort}` }, async (base) => {
  const d = await get(base);
  check("fake: metrics_source is prometheus", d.metrics_source === "prometheus", d.metrics_source);
  check("fake: prometheus tile is up", d.service_status.checks.prometheus.status === "up");
  const r = d.request_metrics;
  check("fake: requests 4321, rpm 7", r.total_24h === 4321 && r.rpm_current === 7, JSON.stringify(r));
  check("fake: p50 45 ms, p95 310 ms, p99 900 ms", r.latency_p50 === 45 && r.latency_p95 === 310 && r.latency_p99 === 900);
  check("fake: server error rate 0.5%", Math.abs(r.error_rate_1h - 0.5) < 0.001, String(r.error_rate_1h));
  check("fake: chat 12 conversations, inference p50 1200 ms, cache hit rate 25, rate limits 1", d.chat_metrics.avg_inference_ms === 1200 && d.chat_metrics.conversations_24h === 12 && d.chat_metrics.cache_hit_rate === 25 && d.chat_metrics.rate_limit_hits_24h === 1, JSON.stringify(d.chat_metrics));
  check("fake: cold starts 2", d.infrastructure.cold_starts === 2);
  check("fake: chart series have 5 points", d.timeseries.latency_1h.length === 5 && d.timeseries.requests_1h.length === 5);
  const slo = Object.fromEntries(d.slos.map((s) => [s.name, s]));
  check("fake: SLO availability 99.9 met, p95 310 met, server error rate 0.5 met", slo.Availability?.current === 99.9 && slo.Availability?.met && slo["P95 Latency"]?.current === 310 && slo["Server Error Rate"]?.met, JSON.stringify(d.slos.map((s) => [s.name, s.current, s.met])));
  const bad = JSON.stringify(d).match(/NaN|Infinity|undefined/);
  check("fake: payload has no NaN, Infinity or undefined", !bad);
});

fake.close();
const failed = results.filter((r) => !r).length;
console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
