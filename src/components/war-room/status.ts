export type Tone = "ok" | "warn" | "bad" | "neutral";

/** Below this many requests, health and SLO verdicts are not meaningful. */
export const MIN_REQUESTS = 50;

const TONES: Record<string, Tone> = {
  up: "ok",
  healthy: "ok",
  degraded: "warn",
  down: "bad",
  unhealthy: "bad",
};

/** Display state for one check tile. A check that is not configured is neutral, never green. */
export function checkDisplay(status: string): { label: string; tone: Tone } {
  if (status === "not_configured") return { label: "NOT CONFIGURED", tone: "neutral" };
  // Configured but not answering: the page still shows in-memory numbers, so this is information, not an alarm.
  if (status === "unreachable") return { label: "CONFIGURED, UNREACHABLE", tone: "neutral" };
  return { label: status.toUpperCase(), tone: TONES[status] ?? "neutral" };
}

/** Display state for the Overall tile. With too few requests it says it is warming up instead of HEALTHY. */
export function overallDisplay(status: string, totalRequests: number): { label: string; tone: Tone; detail?: string } {
  if (totalRequests < MIN_REQUESTS) {
    return {
      label: "WARMING UP",
      tone: "neutral",
      detail: `Warming up: ${totalRequests} ${totalRequests === 1 ? "request" : "requests"}, SLO shown at ${MIN_REQUESTS}`,
    };
  }
  return checkDisplay(status);
}
