/**
 * Rate limiting for Cloud Run free-tier budget protection.
 *
 * Cloud Run free tier (monthly):
 *   180,000 vCPU-seconds — at ~10s per chat request = ~18,000 requests
 *   360,000 GiB-seconds
 *   2,000,000 total HTTP requests
 *
 * Budget-safe targets:
 *   ~150 LLM requests/day (leaves headroom for page loads)
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
    "Luis Gimenez is a Site Reliability Engineer on the Home Services team at The Home Depot, on a large, integration-heavy platform (Salesforce, GCP, internal services) in a ~$6B division.\n\n" +
      "Before this role (Jan 2024 – Mar 2026) he was a Software Engineer II on Enterprise Payments, building Go authorization services on CockroachDB. He works within these platforms, not as their sole architect. His specific contributions include:\n" +
      "- Drove a production change through CAB approval solo and made it the repeatable CI/CD governance pattern\n" +
      "- Owned a transaction-metrics ETL app end to end\n" +
      "- Contributed production code to Card Broker (credit/debit routing) for approximately two years\n" +
      "- Carried on-call ('interrupt') rotation and contributed to incident response\n" +
      "- GCP Professional Cloud Architect certified\n\n" +
      "The strongest hiring read is Senior-level backend/platform/SRE roles.\n\n" +
      "For details, visit /about or /work.",
  ],
  [
    "what gcp services has luis used?",
    "Luis is GCP Professional Cloud Architect certified and works within a GKE-based payments platform.\n\n" +
      "Services he has hands-on experience with:\n" +
      "Compute: GKE (daily), Cloud Run (portfolio)\n" +
      "Data: Pub/Sub (CDC changefeeds), BigQuery, Cloud SQL, CockroachDB\n" +
      "Security: Cloud KMS (Tink encryption), Secret Manager, Sensitive Data Protection\n" +
      "DevOps: Cloud Build, Artifact Registry, Spinnaker\n" +
      "IaC: CDK8s, Terraform\n\n" +
      "He pursued the certification independently and it directly informed the team's PCF-to-GCP migration.",
  ],
  [
    "what's luis's tech stack?",
    "Languages: Go (primary at Home Depot), TypeScript (portfolio), Java (legacy services)\n\n" +
      "Observability: Prometheus/PromQL, Grafana, Loki, Tempo, Pyroscope, OpenTelemetry\n" +
      "Cloud: GCP (Professional Architect certified)\n" +
      "Data: CockroachDB, PostgreSQL, Redis\n" +
      "Infrastructure: CDK8s, Terraform, Docker, Kubernetes (GKE)\n\n" +
      "Domains: Payment Systems, Observability, Production Operations, Cloud Migration",
  ],
  [
    "is luis open to remote work?",
    "Yes. Luis is based in Parrish, FL and is seeking Senior Software Engineer (Backend/Go), Senior SRE, or Senior Full-Stack roles.\n\n" +
      "Default is remote, U.S.-based. Not open to relocation. Light hybrid (up to 2 days/week) works only for an office within commuting distance of Parrish (e.g. Bradenton, Sarasota, St. Petersburg, downtown Tampa), and only with strong comp and WLB.\n\n" +
      "US work authorized. No sponsorship required.",
  ],
  [
    "what certifications does luis have?",
    "Luis holds:\n\n" +
      "- Google Cloud Professional Cloud Architect (Active) — skipped associate, went straight for professional\n" +
      "- ITIL Foundation\n\n" +
      "The GCP cert was self-driven and has repeatedly opened doors at Home Depot.",
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
