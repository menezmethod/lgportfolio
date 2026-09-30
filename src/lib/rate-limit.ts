/**
 * Rate limiting for free-tier budget protection.
 *
 * Targets:
 *   ~150 LLM requests/day
 *   2 RPM per IP (prevents single-source abuse)
 *   10 messages per session (conserves tokens)
 */

const RATE_LIMITS_DISABLED = false;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  message?: string;
}

interface DailyCounter {
  count: number;
  resetAt: number;
}

const ipRateLimits = new Map<string, { tokens: number; resetAt: number }>();
const dailyCounters = new Map<string, DailyCounter>();

const CACHED_RESPONSES = new Map<string, string>([
  [
    "tell me about luis",
    "Luis Gimenez is a software engineer with about 5 years in enterprise payments and reliability, based in Tampa Bay, FL.\n\n" +
      "He started on Enterprise Payments at The Home Depot (through Daugherty Business Solutions, contracting there from Apr 2022, then Software Engineer II from Jan 2024), writing Go services on CockroachDB and carrying on-call. Since Mar 2026 he is a Site Reliability Engineer on Home Services.\n\n" +
      "On Home Services he is primary owner, with team input, of the internal telemetry applications. He built the reusable deployment path that lets non-developers ship to production through the required gates, and he helped define the SLO and Critical User Journey model. He earned the GCP Professional Cloud Architect certification in 2023.\n\n" +
      "For details, visit /about or /work.",
  ],
  [
    "is luis open to remote work?",
    "Yes. Luis is in Tampa Bay, FL. Remote U.S. is preferred, and a light hybrid near Tampa is fine. He is a U.S. citizen and needs no sponsorship.",
  ],
  [
    "what certifications does luis have?",
    "Google Cloud Professional Cloud Architect (earned 2023), ITIL Foundation (2020), and a B.S. in Software Development from Western Governors University (2021).",
  ],
]);

export function checkRateLimit(ip: string): RateLimitResult {
  if (RATE_LIMITS_DISABLED) {
    return { allowed: true, remaining: 999, resetAt: Date.now() + 60_000 };
  }

  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = parseInt(process.env.CHAT_MAX_RPM_PER_IP || "6");

  const existing = ipRateLimits.get(ip);

  if (!existing || existing.resetAt < now) {
    ipRateLimits.set(ip, {
      tokens: maxRequests - 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  if (existing.tokens <= 0) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      message:
        "Rate limit reached. Please wait a moment or contact Luis directly at luisgimenezdev@gmail.com",
    };
  }

  existing.tokens--;
  return {
    allowed: true,
    remaining: existing.tokens,
    resetAt: existing.resetAt,
  };
}

/** Daily budget resets at midnight (calendar day). Key is toDateString() so each new day gets a fresh count. */
export function incrementDailyCount(): void {
  const today = new Date().toDateString();
  const existing = dailyCounters.get(today);

  if (!existing) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    dailyCounters.set(today, { count: 1, resetAt: tomorrow.getTime() });
    return;
  }

  existing.count++;
}

/** Calendar-day LLM usage (same counter that enforces CHAT_DAILY_BUDGET). */
export function getDailyBudgetStats(): { used: number; remaining: number; max: number } {
  const max = parseInt(process.env.CHAT_DAILY_BUDGET || "150", 10);
  if (RATE_LIMITS_DISABLED) {
    return { used: 0, remaining: max, max };
  }
  const today = new Date().toDateString();
  const used = dailyCounters.get(today)?.count ?? 0;
  return { used, remaining: Math.max(0, max - used), max };
}

/** Resets every calendar day (midnight); 150 LLM requests per day by default. */
export function isDailyBudgetExhausted(): boolean {
  if (RATE_LIMITS_DISABLED) return false;
  const today = new Date().toDateString();
  const budget = parseInt(process.env.CHAT_DAILY_BUDGET || "150");
  const existing = dailyCounters.get(today);
  if (!existing) return false;
  return existing.count >= budget;
}

export async function getCachedResponse(
  query: string
): Promise<string | null> {
  const normalizedQuery = query.toLowerCase().trim();

  if (CACHED_RESPONSES.has(normalizedQuery)) {
    return CACHED_RESPONSES.get(normalizedQuery)!;
  }

  for (const [key, value] of CACHED_RESPONSES.entries()) {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      return value;
    }
  }

  return null;
}

export function getSessionMessageCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const count = sessionStorage.getItem("chatMessageCount");
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

export function incrementSessionMessageCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const current = getSessionMessageCount();
    const newCount = current + 1;
    sessionStorage.setItem("chatMessageCount", newCount.toString());
    return newCount;
  } catch {
    return 0;
  }
}

export function isSessionLimitReached(): boolean {
  if (RATE_LIMITS_DISABLED) return false;
  const maxMessages = parseInt(
    process.env.NEXT_PUBLIC_CHAT_MAX_MESSAGES || "30"
  );
  return getSessionMessageCount() >= maxMessages;
}
