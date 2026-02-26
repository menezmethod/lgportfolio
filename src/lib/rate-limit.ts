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
    "Luis Gimenez is a Software Engineer II (SE II) on the Enterprise Payments Platform team at The Home Depot — a team of 100+ engineers operating 50+ microservices processing ~185K transactions/hour.\n\n" +
      "He did not build the platform. He works within it. His specific contributions include:\n" +
      "- Built Grafana observability dashboards adopted by VP-level leadership (his signature work)\n" +
      "- Contributed production code to Card Broker (credit/debit routing) for ~2 years\n" +
      "- Owns interrupt rotation — production reliability at 2 AM\n" +
      "- Advocated for and implemented PII masking for PCI DSS compliance\n" +
      "- GCP Professional Cloud Architect certified\n\n" +
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
    "Yes. Luis is based in Florida and is seeking Senior, Staff, SRE, or Architect roles.\n\n" +
      "Open to remote, hybrid, or relocation — particularly Atlanta, Austin, NYC, SF/Bay Area, Seattle, or Denver.\n\n" +
      "US work authorized. No sponsorship required.",
  ],
  [
    "what certifications does luis have?",
    "Luis holds:\n\n" +
      "- Google Cloud Professional Cloud Architect (Active) — skipped associate, went straight for professional\n" +
      "- CompTIA Project+\n" +
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
  const maxRequests = parseInt(process.env.CHAT_MAX_RPM_PER_IP || "2");

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
    process.env.NEXT_PUBLIC_CHAT_MAX_MESSAGES || "10"
  );
  return getSessionMessageCount() >= maxMessages;
}
