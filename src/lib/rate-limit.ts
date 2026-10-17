/**
 * Rate limiting for free-tier budget protection.
 *
 * Limits come from env (see getChatLimits): CHAT_DAILY_BUDGET (default 150), CHAT_MAX_RPM_PER_IP (6),
 * CHAT_MAX_MESSAGES_PER_SESSION (30). getChatLimits is the single source the server, the War Room and the
 * chat page (through /api/chat/storage) all use.
 */

const RATE_LIMITS_DISABLED = false;

function envInt(value: string | undefined, fallback: number): number {
  const n = parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Effective chat limits, env-aware, with defaults. No secrets. Server-side only. */
export function getChatLimits(): { maxMessagesPerSession: number; maxRpmPerIp: number; dailyBudget: number } {
  return {
    // NEXT_PUBLIC_CHAT_MAX_MESSAGES is only a legacy fallback; the server value wins.
    maxMessagesPerSession: envInt(
      process.env.CHAT_MAX_MESSAGES_PER_SESSION,
      envInt(process.env.NEXT_PUBLIC_CHAT_MAX_MESSAGES, 30)
    ),
    maxRpmPerIp: envInt(process.env.CHAT_MAX_RPM_PER_IP, 6),
    dailyBudget: envInt(process.env.CHAT_DAILY_BUDGET, 150),
  };
}

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
  const maxRequests = getChatLimits().maxRpmPerIp;

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
        `Rate limit reached (${maxRequests} questions per minute). Please wait a moment or contact Luis directly at luisgimenezdev@gmail.com`,
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
  const max = getChatLimits().dailyBudget;
  if (RATE_LIMITS_DISABLED) {
    return { used: 0, remaining: max, max };
  }
  const today = new Date().toDateString();
  const used = dailyCounters.get(today)?.count ?? 0;
  return { used, remaining: Math.max(0, max - used), max };
}

/** Resets every calendar day (midnight); CHAT_DAILY_BUDGET LLM requests per day (default 150). */
export function isDailyBudgetExhausted(): boolean {
  if (RATE_LIMITS_DISABLED) return false;
  const today = new Date().toDateString();
  const budget = getChatLimits().dailyBudget;
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

/** Client helper: the limit comes from the server (GET /api/chat/storage), never from a build-time constant. */
export function isSessionLimitReached(maxMessages: number | null): boolean {
  if (RATE_LIMITS_DISABLED || maxMessages === null) return false;
  return getSessionMessageCount() >= maxMessages;
}
