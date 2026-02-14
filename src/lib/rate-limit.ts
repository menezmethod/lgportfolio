// Rate limiting for Gemini free tier
// Implements: per-IP token bucket, session caps, daily budget

/** Set to true to disable all rate limits (for now). */
const RATE_LIMITS_DISABLED = true;

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

// In-memory stores (reset on cold start, which is fine)
const ipRateLimits = new Map<string, { tokens: number; resetAt: number }>();
const dailyCounters = new Map<string, DailyCounter>();

// Pre-seeded cache for common queries
const CACHED_RESPONSES = new Map<string, string>([
  [
    "tell me about luis's experience",
    "Luis Gimenez is a Software Engineer II at The Home Depot specializing in enterprise payment systems.\n\n" +
    "Current Role: Software Engineer II, Payment Systems @ The Home Depot\n" +
    "- Architecting mission-critical payment processing systems handling millions in daily transactions\n" +
    "- Working with Go, Java, and Google Cloud Platform\n" +
    "- GCP Professional Cloud Architect certified\n\n" +
    "Experience:\n" +
    "- 5+ years in enterprise software development\n" +
    "- Focus on payment infrastructure, microservices, and cloud architecture\n" +
    "- Experience with legacy system modernization at scale\n\n" +
    "Location: Parrish, Florida area\n\n" +
    "For more details, visit /about or /experience."
  ],
  [
    "what gcp services has luis used?",
    "Luis has extensive experience with Google Cloud Platform services:\n\n" +
    "Compute: Cloud Run, GKE, Compute Engine, App Engine\n" +
    "Data: BigQuery, Cloud SQL, Cloud Storage, Pub/Sub\n" +
    "AI/ML: Vertex AI, Gemini API, Embeddings\n" +
    "Networking: Cloud CDN, Cloud Load Balancing, VPC\n" +
    "DevOps: Cloud Build, Artifact Registry, Secret Manager\n" +
    "Architecture: Event-driven patterns, microservices, Kubernetes\n\n" +
    "He has architected production systems on GCP handling enterprise-scale payment volumes."
  ],
  [
    "describe the churnistic project",
    "Churnistic is an AI-powered customer churn prediction platform:\n\n" +
    "Stack: TypeScript, React, Firebase, TensorFlow\n" +
    "Architecture: Event-driven microservices\n" +
    "Metrics: 95% code coverage, p99 < 200ms latency\n\n" +
    "Key Features:\n" +
    "- Real-time churn prediction using ML models\n" +
    "- Dashboard with actionable insights\n" +
    "- Automated customer segmentation\n\n" +
    "The project demonstrates AI/ML integration skills and production-grade TypeScript development."
  ],
  [
    "what's luis's tech stack?",
    "Languages: Go, Java, TypeScript, Rust, Python\n\n" +
    "Cloud: Google Cloud Platform (GCP Professional Architect certified)\n\n" +
    "Frameworks: React, Next.js, Node.js, Spring Boot\n\n" +
    "Tools: Docker, Kubernetes, Terraform, Git, CI/CD\n\n" +
    "Domains: Payment Systems, Microservices, System Architecture, AI/ML"
  ],
  [
    "is luis open to remote work?",
    "Yes! Luis is open to remote opportunities. He is based in the Parrish, Florida area and is actively seeking GCP Cloud Architect and AI Architecture roles.\n\n" +
    "He is flexible on location and eager to contribute to innovative teams working on cloud-native systems and AI solutions."
  ],
  [
    "how does luis's experience map to cloud architect roles?",
    "Luis's experience directly maps to cloud architect roles:\n\n" +
    "Required Skill -> Luis's Evidence -> Strength\n" +
    "GCP Expertise -> Daily production workloads on GCP -> Strong\n" +
    "System Design -> Payment systems handling millions -> Strong\n" +
    "Microservices -> Event-driven architectures -> Strong\n" +
    "Terraform -> Infrastructure as Code for portfolio -> Strong\n" +
    "AI/ML -> RAG pipeline, Churnistic project -> Good\n" +
    "Leadership -> Architecture decisions at Home Depot -> Strong\n\n" +
    "His payment systems experience demonstrates the scale and complexity required for architect roles."
  ],
  [
    "tell me about luis's payment systems work",
    "Luis architects enterprise payment systems at The Home Depot:\n\n" +
    "Scale: Millions in daily transactions\n" +
    "Technologies: Go, Java, GCP\n" +
    "Focus:\n" +
    "- Legacy system modernization\n" +
    "- New payment solution architecture\n" +
    "- Compliance and security\n" +
    "- High-availability design\n\n" +
    "His work involves building fault-tolerant, scalable systems that process payments reliably at enterprise scale."
  ],
  [
    "what certifications does luis have?",
    "Luis holds:\n\n" +
    "Google Cloud Professional Cloud Architect - Certified\n" +
    "- Validates expertise in designing and managing GCP solutions\n" +
    "- Demonstrates knowledge of cloud architecture best practices\n\n" +
    "This certification directly aligns with his target roles in GCP Cloud Architecture."
  ],
  [
    "describe luis's architecture philosophy",
    "Luis's architecture approach:\n\n" +
    "1. Start Simple - Do not over-engineer. Solve the problem at hand.\n" +
    "2. Scale Incrementally - Design for today, enable tomorrow\n" +
    "3. Embrace Trade-offs - Every decision has costs; be explicit about them\n" +
    "4. Operational Excellence - Monitoring, observability, and automation first\n" +
    "5. Security by Default - Not an afterthought\n\n" +
    "He believes in practical architecture that delivers business value while maintaining flexibility for future needs."
  ],
]);

export function checkRateLimit(ip: string): RateLimitResult {
  if (RATE_LIMITS_DISABLED) {
    const now = Date.now();
    return { allowed: true, remaining: 999, resetAt: now + 60_000 };
  }
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = parseInt(process.env.CHAT_MAX_RPM_PER_IP || "3");

  const existing = ipRateLimits.get(ip);

  if (!existing || existing.resetAt < now) {
    // New window
    ipRateLimits.set(ip, { tokens: maxRequests - 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (existing.tokens <= 0) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      message:
        "You've reached the rate limit. Please wait a moment or contact Luis directly at luisgimenezdev@gmail.com",
    };
  }

  existing.tokens--;
  return { allowed: true, remaining: existing.tokens, resetAt: existing.resetAt };
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
  const budget = parseInt(process.env.CHAT_DAILY_BUDGET || "900");
  const existing = dailyCounters.get(today);

  if (!existing) return false;
  return existing.count >= budget;
}

export async function getCachedResponse(query: string): Promise<string | null> {
  const normalizedQuery = query.toLowerCase().trim();

  // Exact match
  if (CACHED_RESPONSES.has(normalizedQuery)) {
    return CACHED_RESPONSES.get(normalizedQuery)!;
  }

  // Fuzzy match - check for key phrases
  for (const [key, value] of CACHED_RESPONSES.entries()) {
    if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
      return value;
    }
  }

  return null;
}

export function getSessionMessageCount(): number {
  // Cannot use sessionStorage on server
  if (typeof window === 'undefined') return 0;
  try {
    const count = sessionStorage.getItem('chatMessageCount');
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

export function incrementSessionMessageCount(): number {
  // Cannot use sessionStorage on server
  if (typeof window === 'undefined') return 0;
  try {
    const current = getSessionMessageCount();
    const newCount = current + 1;
    sessionStorage.setItem('chatMessageCount', newCount.toString());
    return newCount;
  } catch {
    return 0;
  }
}

export function isSessionLimitReached(): boolean {
  if (RATE_LIMITS_DISABLED) return false;
  const maxMessages = parseInt(process.env.NEXT_PUBLIC_CHAT_MAX_MESSAGES || "20");
  return getSessionMessageCount() >= maxMessages;
}
