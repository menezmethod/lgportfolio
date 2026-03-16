const targets = [
  { name: "homepage", url: "https://gimenez.dev/" },
  { name: "health_api", url: "https://gimenez.dev/api/health", expectJsonStatus: true },
  { name: "war_room", url: "https://gimenez.dev/war-room" },
  { name: "war_room_data", url: "https://gimenez.dev/api/war-room/data" },
];

const timeoutMs = 8000;

async function probe(target) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(target.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "menez-site-sentinel/1.0",
      },
    });

    const bodyText = await response.text();
    let appStatus = null;

    if (target.expectJsonStatus) {
      try {
        const parsed = JSON.parse(bodyText);
        appStatus = parsed.status ?? null;
      } catch {
        appStatus = "invalid-json";
      }
    }

    return {
      name: target.name,
      url: target.url,
      healthy: response.ok && (!target.expectJsonStatus || appStatus === "healthy"),
      statusCode: response.status,
      durationMs: Date.now() - startedAt,
      appStatus,
      bodyPreview: bodyText.replace(/\s+/g, " ").slice(0, 160),
    };
  } catch (error) {
    return {
      name: target.name,
      url: target.url,
      healthy: false,
      statusCode: null,
      durationMs: Date.now() - startedAt,
      appStatus: null,
      error: error?.name === "AbortError" ? `timeout after ${timeoutMs}ms` : String(error?.message || error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

const checkedAt = new Date().toISOString();
const results = await Promise.all(targets.map((target) => probe(target)));
const failures = results.filter((result) => !result.healthy);

console.log(
  JSON.stringify({
    workflow: "site-sentinel",
    checkedAt,
    status: failures.length > 0 ? "degraded" : "healthy",
    summary:
      failures.length > 0
        ? `${failures.length} failing checks: ${failures.map((failure) => failure.name).join(", ")}`
        : "all checks healthy",
    results,
  }),
);
