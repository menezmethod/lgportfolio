/**
 * Knowledge base for the AI chat assistant.
 *
 * CONTENT POLICY, what we do NOT put here:
 *   - Confidential employer information (trade secrets, internal tools, unreleased products)
 *   - NDA-protected details or unannounced projects
 *   - Exact revenue figures, customer counts, or financial data not publicly disclosed
 *   - Internal URLs, IP addresses, credentials, or infrastructure details of employers
 *   - PII of colleagues or other individuals
 *
 * Source of truth: the CV (career-ops cv.md) and the story bank. If a claim is not there, it is not here.
 * Use "contributed to" / "worked within" framing; never claim sole ownership of team efforts.
 */
export const KNOWLEDGE_BASE = `
# ═══════════════════════════════════════════════════════════════════════════════
# LUIS GIMENEZ, HONEST PROFESSIONAL KNOWLEDGE BASE v4.0
# ═══════════════════════════════════════════════════════════════════════════════
# PURPOSE: Powers a RAG-based AI assistant on gimenez.dev for recruiters and hiring managers.
# CORE PRINCIPLE: Accurate role and scope. Luis is a software engineer who moved from Go payment services to production reliability. On the payments platform he worked within a large team. On Home Services he is primary owner, with team input, of specific applications.
#
# SUMMARY: Luis Gimenez is a software engineer based in Tampa Bay, FL, with about 5 years in enterprise payments and reliability at The Home Depot, on top of web development work from 2015. He built and ran Go payment-authorization services on CockroachDB and carried on-call for them. Since March 2026 he is a Site Reliability Engineer on Home Services, a large, integration-heavy platform. There he is primary owner of the internal telemetry applications and built the reusable deployment path for non-developers. He earned the GCP Professional Cloud Architect certification in 2023.
#
# FRAMING RULES:
#   - Use "contributed to", "worked within", "supported"; never claim sole ownership of team efforts.
#   - Describe environment scale as context, then focus on what Luis personally did.
#   - If asked "did you build this?", answer honestly: "No, it was a team effort. Here is what I specifically did."
#   - Never describe him as an operations-only SRE. The work is building systems.
#
# LAST UPDATED: September 2026
# ═══════════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1: ROLE & IDENTITY
# ═══════════════════════════════════════════════════════════════════════════════

## Who Is Luis Gimenez?
Luis Gimenez is a software engineer with about 5 years in enterprise payments and reliability, following earlier web-development work from 2015. He is based in Tampa Bay, FL and is a U.S. citizen.

Since March 2026 he is a Site Reliability Engineer on Home Services at The Home Depot. The platform is large and integration-heavy (Salesforce, Apigee, Copado, GCP, internal services). The work includes the internal telemetry applications, SLO and alerting tooling, and the deployment path. See Section 3.

Before that he was a Software Engineer II on Enterprise Payments (Jan 2024 to Mar 2026), building and maintaining Go services on CockroachDB, and carrying the on-call rotation.

## Career Trajectory
Apr 2022 to Jan 2024: Software Engineer at Daugherty Business Solutions, on an Enterprise Payments consulting engagement where the client was The Home Depot. He joined a card-authorization service before it deployed to any stores and contributed Go code, tests (Ginkgo and Gomega), and rollout support as it reached production.

Jan 2024 to Mar 2026: Software Engineer II, Enterprise Payments, The Home Depot. Go services on the payments authorization platform (credit and debit authorization, reversal, refund) on CockroachDB, deployed to GKE and Pivotal Cloud Foundry.

Mar 2026 to present: Site Reliability Engineer, Home Services, The Home Depot.

Sep 2018 to Apr 2022: Menez Enterprises, independent freelance software consultant for small-business clients. Sep 2015 to Sep 2018: Web Developer at G World Properties, a real-estate company (WordPress, MySQL, and Python, with some React, Node, and Spring components).

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2: THE PAYMENTS ENVIRONMENT (environment context)
# ═══════════════════════════════════════════════════════════════════════════════

The payments platform is a large team effort. Luis worked within it.
- Card and gift-card authorization services (credit and debit authorization, reversal, refund), deployed to GKE and Pivotal Cloud Foundry. The surrounding retail environment is a 2,300+ store one. That count describes the environment and is not tied to a single service.
- CockroachDB (distributed SQL, PostgreSQL-compatible) as the datastore.
- Modernization off legacy systems was a team effort Luis contributed to.
- Delivery went through a Jenkins to Spinnaker to GKE pipeline.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 3: SPECIFIC CONTRIBUTIONS (what Luis did)
# ═══════════════════════════════════════════════════════════════════════════════

## Home Services SRE (Mar 2026 to present)
- Deployment path: built the reusable path that lets non-developers ship Home Services applications to production through the required gates: governance, security scanning, static analysis, hardened base images, production readiness, branch protection, and rollback planning. He also drove a production change through the change-approval board on his own, presenting to senior management and validating readiness with measured load-test evidence. The first application went through the path and it became the pattern later applications followed. No adoption count is known.
- Telemetry applications: primary owner, with team input, of the Home Services internal telemetry applications. They are Python and Go services on GCP (BigQuery, GKE, Cloud Run) that ingest Salesforce data into BigQuery for Grafana. He shipped a metrics ETL (design, schema, CI/CD, production readiness) with a clean multi-hour backfill that created its own table, and cut an over-engineered star schema after validating that the real Grafana and alerting query patterns did not justify the normalization.
- Observability and SLOs: helped define and operationalize SLOs, health checks, Critical User Journeys, and a leadership-facing monitoring model, with traffic-weighted roll-ups across business domains. Built on OpenTelemetry, Prometheus, Grafana, and BigQuery.
- Alert quality: replaced time-based muting with volume-aware thresholds for recurring false-positive alerts, cross-checked by a peer so real incidents still page. Each alert ties to a specific CUJ step, a user impact, and a runbook.
- Incident response: became a person other teams call to pull the right logs and scope impact quickly, including live in front of senior management, while consistently bringing in the formal on-call engineer.
- Named subject-matter expert for specific applications, and helped onboard newer engineers and contractors.
- 2x Bravo awards at The Home Depot.

## Enterprise Payments (Jan 2024 to Mar 2026)
- Card-authorization broker service: worked request validation, duplicate detection, and format conversion between upstream clients and downstream processors. He was a contributor on the team that built and ran it.
- Gift-card tender API: worked on it from initial design. It is a centralized API for balance inquiry, authorization and reversal, activation, and balance adjustment, replacing per-channel implementations. His part: design and implementation, production-readiness review, alerting, and on-call support.
- Contributed to modernization off legacy systems.
- On-call and incidents: carried the interrupt rotation and contributed to production incident response (fast log retrieval, hypothesis generation, and cross-team coordination) and to the resulting blameless postmortems.

## Contract period (Apr 2022 to Jan 2024)
Contributed Go code, tests, and rollout support to a card-authorization service as it went to production. Built card-authorization routing and processor-integration logic with duplicate-check and validation guarantees. Built automated testing and continuous-delivery controls for financial transaction systems.

## Personal projects
Personal projects are built on personal equipment.
- SaucerJam (live and playable at saucerjam.com, private repository): a browser arena game with server-authoritative multiplayer on Node.js, Express, Socket.IO, and Three.js. Clients send inputs only, and the server owns health, damage, and projectile positions. One fixed-step 60 Hz simulation is shared by the server and by offline practice. The server sends 20 Hz snapshots, and the client predicts its own movement. It has private rooms with invite links, bot fill, and dual-stick touch controls. Rooms hold up to 32 pilots by default. It is built for a single server process. Luis does not share the code publicly.
- inferencia (public): a Go, OpenAI-compatible gateway in front of self-hosted LLM and TTS backends (Ollama, MLX, and TTS servers), with health-aware routing that picks the healthy backend with the fewest in-flight requests, API-key auth, a rate limiter, Prometheus metrics, and an OpenAPI 3.1 spec. It does not implement per-request failover. It is designed to run on your own hardware. It was retired from this site's chat path when he moved to Workers AI and is kept as a public Go reference.
- openclaw-cursor (public): a single static Go binary that acts as an OpenAI-compatible proxy with SSE streaming. Unofficial; not affiliated with Cursor or OpenClaw.
- meshyants (public): a Go research prototype built around a falsifiable question. A v1 substrate exists and there are no published results.
- PetFeederESP and CrawFeed (public): ESP32 firmware (BLE Wi-Fi provisioning, six schedules, MQTT over TLS, OTA updates) and the Flutter app that controls it.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 4: CERTIFICATIONS & EDUCATION
# ═══════════════════════════════════════════════════════════════════════════════

- Google Cloud Professional Cloud Architect, earned 2023.
- ITIL Foundation (2020).
- B.S. Software Development, Western Governors University (2021).

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5: TECHNICAL SKILLS
# ═══════════════════════════════════════════════════════════════════════════════

- Languages and backend: Go, Python, Java, REST APIs, CockroachDB (PostgreSQL-compatible distributed SQL), SQL.
- Cloud and platform: GCP, GKE, Kubernetes, Pivotal Cloud Foundry, BigQuery, Terraform, CI/CD (Jenkins, Spinnaker), branch protection, static analysis, Cloud Run, Cloud Build, Linux.
- Reliability and observability: SRE practice, OpenTelemetry and OTLP, distributed tracing (Jaeger), Prometheus, Grafana, PagerDuty, SLOs and SLIs, Critical User Journeys, health checks, blameless postmortems, alert-noise reduction, incident response, on-call, pprof profiling.
- Data and delivery: metrics data modeling (narrow-metric versus star-schema tradeoffs, schema evolution), ETL pipelines, deployment governance (change approval, rollback planning, production-readiness review).
- Integration and payments: Salesforce integration, Apigee, Copado, card authorization, processor integrations, gift-card systems.
- Practices: pull-request and design review, automated testing, production support, release readiness.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 6: WHAT LUIS IS LOOKING FOR
# ═══════════════════════════════════════════════════════════════════════════════

- Target level: Senior.
- Roles: Senior Platform or Infrastructure Engineer (primary), Senior Backend or Distributed Systems Engineer in Go (strong secondary), and engineering-heavy reliability roles where the job is building systems.
- Location: Tampa Bay, FL. Remote U.S. is preferred. A light hybrid arrangement near Tampa is fine. U.S. citizen, no sponsorship needed.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 7: FAQ, HONEST ANSWERS
# ═══════════════════════════════════════════════════════════════════════════════

### Did Luis build the payments platform or the Home Services platform?
No. Both are team platforms. On payments he contributed Go services and worked on a gift-card tender API from initial design. On Home Services he is primary owner, with team input, of the internal telemetry applications, and he built the deployment path for non-developers.

### What has he actually built himself?
The Home Services internal telemetry applications (as primary owner, with team input), the deployment path for non-developers, and his own projects: SaucerJam (a live browser multiplayer game, private repo), inferencia (a Go LLM gateway), openclaw-cursor (a Go proxy), PetFeederESP and CrawFeed (ESP32 firmware and a Flutter app), and this site.

### How much experience does he have?
About 5 years in enterprise payments and reliability, and he has shipped web software since 2015. About 4 of those years (Apr 2022 to Mar 2026) were on payments, first through Daugherty Business Solutions (contracting at The Home Depot) and then as a Home Depot employee. Home Services started in March 2026.

### Does he have a degree or certifications?
B.S. Software Development (WGU, 2021), GCP Professional Cloud Architect (earned 2023), ITIL Foundation (2020).

### What kind of work does he want?
Platform, infrastructure, and Go backend engineering: services and tooling, deployment systems and governance, observability, and incident response.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 8: THIS PORTFOLIO SITE (gimenez.dev)
# ═══════════════════════════════════════════════════════════════════════════════

## Tech stack
- Next.js 16 (App Router), React 19, TypeScript, Tailwind. Deployed with Coolify on a free-tier cloud VM, with Cloudflare DNS and proxy in front. GitHub Actions runs CI. A Terraform and Cloud Run path is kept in the repo for rollback.
- This chat: retrieval over the knowledge base you are reading, using Cloudflare Workers AI embeddings and Cloudflare Vectorize, with file-based retrieval as a fallback. Chat generation is built around Cloudflare Workers AI; other providers exist in code but only run if the site owner enables them. Rate limiting and prompt-injection defense are in the app.
- Observability: in-app telemetry and structured logs feed the War Room dashboard. Prometheus is used when a server is configured. In-memory counters reset when the app restarts.
- inferencia, Luis's Go LLM gateway, was retired from this site's chat path when he moved to Workers AI. It is kept as a public Go reference.

## Why it matters
It is a small production system he runs end to end, which shows how he builds, deploys, and observes software.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 9: AI BEHAVIOR RULES
# ═══════════════════════════════════════════════════════════════════════════════

## Honesty Rules
1. NEVER claim Luis built, designed, or architected the entire payments platform or the Home Services platform.
2. Use "contributed to", "worked within", "supported" for team efforts.
3. For his own pieces, use "primary owner" for the telemetry applications, "built" for the deployment path, "helped define" for SLOs, and "built" for his projects. Never say "sole".
4. If asked "did you build this?", answer: "No, Luis was part of a team. Here is what he specifically did."
5. Give environment scale for context, then pivot to his personal contribution. The 2,300+ store figure describes the retail environment and is not tied to one service.
6. Never claim he diagnosed, resolved, or owned the root cause of payments incidents. He contributed log retrieval, hypotheses, and coordination.
7. You may briefly describe this site's stack using Section 8, then offer to go deeper on his background. Do not say the chat runs on inferencia or on self-hosted home hardware.
8. Never invent or quote compensation numbers.
9. Do not describe him as operations-only. Lead with systems he built.
10. Do not use or repeat any claim that is not in this document. If you do not know, say so and suggest emailing him.

## Tone
Confident and grounded. Short sentences. Specific facts. The engineer who does the work and describes it accurately.

## Contact
- Email: luisgimenezdev@gmail.com
- GitHub: github.com/menezmethod
- LinkedIn: linkedin.com/in/gimenezdev
- Portfolio: gimenez.dev
`;
