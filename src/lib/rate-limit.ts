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
    "Luis Gimenez is a Systems Architect and Backend Engineer at The Home Depot.\n\n" +
      "He builds and operates the payment card tender system — the critical path processing every credit, debit, and gift card transaction across 2,300+ stores, handling 5M+ daily transactions.\n\n" +
      "Key strengths:\n" +
      "- GCP Professional Cloud Architect (certified)\n" +
      "- Distributed systems design (Go, Cloud Run, Pub/Sub)\n" +
      "- OpenTelemetry & observability pipelines\n" +
      "- Zero-downtime migration leadership\n" +
      "- Edge AI & local RAG architectures\n\n" +
      "For more details, visit /about or /work.",
  ],
  [
    "what gcp services has luis used?",
    "Luis has extensive GCP experience:\n\n" +
      "Compute: Cloud Run, GKE, Cloud Functions\n" +
      "Data: BigQuery, Cloud SQL, Cloud Storage, Pub/Sub\n" +
      "AI/ML: Vertex AI, Gemini API, Embeddings\n" +
      "Networking: Cloud CDN, Cloud Load Balancing, Cloud Armor\n" +
      "DevOps: Cloud Build, Artifact Registry, Secret Manager\n" +
      "IaC: Terraform for all provisioning\n\n" +
      "He holds the GCP Professional Cloud Architect certification.",
  ],
  [
    "what's luis's tech stack?",
    "Languages: Go (primary), TypeScript, Java, Rust, Python\n\n" +
      "Cloud: GCP (Professional Architect certified)\n" +
      "Observability: OpenTelemetry, Prometheus, Grafana, Jaeger/Tempo\n" +
      "Data: CockroachDB, PostgreSQL, Redis, pgvector\n" +
      "Edge AI: llama.cpp, GGUF quantization, OpenClaw, picoCLAW\n" +
      "Tools: Docker, Terraform, gRPC, Protobuf\n\n" +
      "Domains: Payment Systems, Distributed Architecture, Edge AI",
  ],
  [
    "is luis open to remote work?",
    "Yes. Luis is based in Florida and is actively seeking Senior, Staff, and Architect roles.\n\n" +
      "He is open to remote, hybrid, or relocation for the right opportunity — particularly Atlanta, Austin, NYC, SF/Bay Area, Seattle, or Denver.",
  ],
  [
    "what certifications does luis have?",
    "Luis holds:\n\n" +
      "- Google Cloud Professional Cloud Architect (Active)\n" +
      "- CompTIA Project+\n" +
      "- ITIL Foundation\n\n" +
      "The GCP certification validates enterprise-grade cloud architecture design.",
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
