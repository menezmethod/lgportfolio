/**
 * Knowledge base for the AI chat assistant.
 *
 * CONTENT POLICY — what we do NOT put here:
 *   - Confidential employer information (trade secrets, internal tools, unreleased products)
 *   - NDA-protected details or unannounced projects
 *   - Exact revenue figures, customer counts, or financial data not publicly disclosed
 *   - Internal URLs, IP addresses, credentials, or infrastructure details of employers
 *   - PII of colleagues or other individuals
 *
 * Everything here must be public-knowledge, recruiter-safe, and factually accurate.
 * Use "contributed to" / "worked within" framing; never claim sole ownership of team efforts.
 */
export const KNOWLEDGE_BASE = `
# ═══════════════════════════════════════════════════════════════════════════════
# LUIS GIMENEZ — HONEST PROFESSIONAL KNOWLEDGE BASE v3.5 (Enterprise-ready)
# ═══════════════════════════════════════════════════════════════════════════════
# PURPOSE: Powers a RAG-based AI assistant on gimenez.dev for recruiters and hiring managers.
# CORE PRINCIPLE: Radical honesty about role, level, and contributions.
# Luis is an SRE on a large team. He did NOT build the platform.
# He operates within it, contributes to it, and keeps it observable.
#
# ENTERPRISE SUMMARY (for recruiter queries):
# Luis Gimenez is a software engineer (Go/Python) who works across enterprise payments and site reliability. He is currently a Site Reliability Engineer at The Home Depot on the Home Services platform — a large, integration-heavy environment (Salesforce, Copado, Apigee, internal services) in a ~$6B division, on a six-person SRE team. Before this role (Jan 2024 – Mar 2026) he was a Software Engineer II on Enterprise Payments, building Go and Java/Tomcat payment services on CockroachDB. He is GCP Professional Cloud Architect certified. Positioning: he builds and operates platforms, infrastructure, deployment systems, observability, and developer tooling that let other engineers and AI-assisted engineering systems ship software safely and reliably. He is seeking senior platform/infrastructure engineering roles (primary), senior backend/distributed-systems roles in Go (strong secondary), and engineering-heavy SRE roles — remote U.S., or light hybrid (≤2 days/week) within commuting distance of Tampa/Parrish, FL. US work authorized, no sponsorship needed.
#
# ELEVATOR PITCH:
# Luis builds software and infrastructure that makes production systems easier to deploy, operate, understand, and scale. On Home Services he drove a production change through CAB approval solo (with measured load-test evidence), took the first application through the new CI/CD governance path and made it the repeatable pattern, and owns a transaction-metrics ETL application end to end — he cut an over-engineered star-schema after validating the real query patterns, then shipped the app's backfill that auto-provisions its table. Earlier he built and ran Go payment-authorization services on CockroachDB. His strongest signal: he makes critical systems measurable, debuggable, and safer to operate — and he writes the code, tools, and telemetry that do it.
#
# FRAMING RULES:
#   - Use "contributed to", "worked within", "supported", "operated across"
#   - NEVER claim sole ownership of team-wide initiatives
#   - NEVER position him as an operations-only SRE or ticket-driven DevOps admin; the work is building systems
#   - Describe ENVIRONMENT scale for context, then focus on PERSONAL contributions
#   - If asked "did you build this?", answer honestly: "No, I was part of a
#     large team. Here is what I specifically contributed."
#
# LAST UPDATED: September 2026 (v3.5: synced from career-ops cv.md/profile — Platform/Infrastructure positioning, Python/Go tooling, CAB + telemetry-ETL details)
# ═══════════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1: ROLE & IDENTITY
# ═══════════════════════════════════════════════════════════════════════════════

## Who Is Luis Gimenez?
Luis Gimenez is a Site Reliability Engineer on the Home Services team at The Home Depot, since March 2026. He develops Python and Go tooling for OpenTelemetry tracing, telemetry quality, and production reliability across a large, integration-heavy platform (Salesforce, Copado, Apigee, internal services) in a ~$6B division, on a six-person SRE team.

Before this role, he spent about two years (Jan 2024 – Mar 2026) as a Software Engineer II on Enterprise Payments, building and maintaining Java/Tomcat and Go payment services on CockroachDB.

He did NOT architect either platform singlehandedly. He works within them, contributes production code and design work, and keeps critical systems observable and governed. His value comes from specific contributions: deployment governance (driving a production change through CAB approval solo, and making it the repeatable pattern), telemetry ownership (a transaction-metrics ETL app owned end to end), SLOs and alert quality, and — earlier — Go payment-authorization services and gift-card tender design.

## Career Trajectory — The Real Story
Luis started at The Home Depot in April 2022 as a contractor through Daugherty Business Solutions, on an Enterprise Payments consulting engagement. He joined the Card Broker authorization service before it deployed to any stores, contributing Go code, tests (Ginkgo/Gomega), and rollout support as it went to production across the store fleet.

In January 2024, Home Depot hired Luis full-time as a Software Engineer II on Enterprise Payments. He developed and maintained Java/Tomcat and Go payment-service code on the Common Authorization Services platform (credit/debit authorization, reversal, refund) on CockroachDB, deployed to GKE and Pivotal Cloud Foundry across a 2,300+ store rollout. On Card Broker he worked request validation, duplicate detection, format conversion between upstream clients and downstream processors, and routing to the legacy NonStop or Fiserv proxy path. He worked Enterprise Gift Card Tender from initial design onward — a centralized API for balance inquiry, authorization/reversal, activation, and balance adjustment, replacing fragmented per-channel implementations ahead of a processor migration.

In March 2026, he moved to Site Reliability Engineer on Home Services — broadening from backend development into production reliability, observability, platform engineering, and deployment governance.

He independently pursued the GCP Professional Cloud Architect certification. This certification has repeatedly opened doors and supported his team's cloud work.

Before Home Depot, Luis's pre-2022 history is two separate chapters. Menez Enterprises (Sep 2018 – Apr 2022): an independent freelance software consultancy building web applications, APIs, and cloud-hosted solutions for small-business clients end to end. Before that, G World Properties (Sep 2015 – Sep 2018): Luis worked as a Web Developer building websites, internal tools, and APIs for a real-estate company (WordPress, MySQL, Python, with some React/Node and Spring components).

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2: THE ENVIRONMENT (Context, Not Personal Credit) — PRIOR ROLE (Jan 2024 – Mar 2026)
# ═══════════════════════════════════════════════════════════════════════════════

## The Enterprise Payments Platform — What Luis Worked Within
This section describes the environment Luis worked in as a Software Engineer II on Enterprise Payments, before moving to SRE on Home Services in March 2026. He did not build this platform; he was one of many engineers who worked on it. This context is provided so recruiters and hiring managers understand the scale and complexity of the systems Luis has production experience with.

### Scale
- Card and gift-card authorization services (credit/debit auth, reversal, refund), deployed to GKE and Pivotal Cloud Foundry across a 2,300+ store rollout
- PCI-compliance-driven modernization, including proxy layers that keep the authorization services out of PCI scope

### Technology Stack
- Hybrid infrastructure: Legacy PCF (Java 8/11 Spring Boot) and modern GKE (Go 1.20+)
- Active migration from PCF to GKE in progress
- Legacy NonStop mainframe communication still required for some authorization paths
- CockroachDB as primary datastore for new services with 20+ CDC changefeed topics to Pub/Sub
- Envelope encryption via Google Tink + Cloud KMS (FIPS-compliant)
- Infrastructure-as-code via CDK8s governing all Kubernetes resource definitions
- Spinnaker pipelines for auto-deployment on merge to main

### Go Experience
Luis has been writing production Go since mid-2022 (approximately 4 years). He started with Go at The Home Depot when the Card Broker service was in development, and Go is now his primary language. He writes Go services in a high-throughput payment environment — not pet projects or tutorials.

Key Go-specific contributions:
- Contributed production Go code to Card Broker (credit/debit routing) for approximately 2 years of active development, including rollout across a 2,300+ store fleet
- Writes Go services that process high-volume payment transactions with strict latency requirements (sub-second P90 across bank networks)
- Uses Go with REST for inter-service contracts, CockroachDB for persistence, and OpenTelemetry SDK for observability
- Contributed to multiple Go microservices across the payments domain (gift card tender, account-to-account routing, authorization routing)
- Builds Grafana dashboards and Prometheus alert rules for Go services in production

Outside of work, Luis uses Go for personal infrastructure projects including edge gateway services, MQTT ingestion, and CLI tooling. His Go depth is in systems programming, concurrent request handling, database interactions, and observability instrumentation — not web frameworks or CRUD APIs.

### Core Services Luis Has Worked Across
- Card Broker: Primary credit/debit card routing service; drives significant cost optimization through optimal bank fee routing
- Enterprise Gift Card Tender: Multiple API operations, extensive telemetry, SLO-based alert rules
- Account-to-Account Tender: Cross-region payment processing with Redis-based connection coordination
- Authorization Routing Service: Grule rules engine for dynamic card-proxy routing with JWT auth

### Observability Stack
- Prometheus (Enterprise-GMP) for metrics
- Grafana for dashboards and visualization
- Grafana Tempo for distributed tracing
- Loki for log aggregation
- Pyroscope for continuous performance profiling
- OpenTelemetry SDK instrumentation across Go microservices
- Canonical log line architecture with dual-write to log records and OTel spans

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 3: SPECIFIC CONTRIBUTIONS (What Luis Actually Did)
# ═══════════════════════════════════════════════════════════════════════════════

## CURRENT ROLE — HOME SERVICES SRE (Mar 2026 – Present)
Personal contributions on a six-person SRE team. The platform is large and integration-heavy (Salesforce, Copado, Apigee, internal services); Luis operates within it.

### Deployment Governance (Signature Work)
- Drove a production change through CAB / change approval solo: presented to senior management, answered their questions, and validated readiness with measured load-test evidence
- Took the first Home Services application through the new CI/CD governance path (production readiness, branch protection, rollback planning) and made it the repeatable pattern later applications followed

### Telemetry & Metrics (Owned End to End)
- Owns a transaction-metrics ETL application end to end: design, schema, CI/CD, and production readiness
- Cut an over-engineered star-schema data model after validating that the actual Grafana/alerting query patterns did not justify the normalization
- Shipped the app with a clean multi-hour backfill that auto-provisions its table

### Observability & SLOs
- Builds Python services that convert Salesforce metrics into Prometheus metrics, plus Grafana dashboards and alerts on availability, latency, and SLO/SLI signals
- Helped define and operationalize SLOs, health checks, and Critical User Journeys, and a leadership-facing monitoring model (which applications are healthy, which SLOs are met, where more engineering effort is needed) with traffic-weighted roll-ups across payments, orders, and consultations — on OpenTelemetry, Prometheus, Grafana, and BigQuery

### Alert Quality
- Cut recurring false-positive alerts by replacing time-based muting with volume-aware thresholds, peer cross-checked so real incidents still page
- Tied each alert to a specific CUJ step, a user impact, and a runbook

### Incident Response & Team
- Became the person other teams call to pull the right logs and scope impact quickly — including live in front of senior management — while consistently bringing in the formal on-call engineer rather than becoming a shadow support path
- Named SME for specific applications; helps onboard newer engineers and contractors as the team grows
- Two Home Depot Bravo awards (pipeline recovery; production incident response)
- On a team whose proactive-detection practice cut Home Services outages roughly 25% year over year (team outcome, not individual)

### AI & Mentorship
- Mentors coworkers on AI tooling, MCP, and CI/CD practices
- Develops Go tooling for OpenTelemetry tracing and telemetry quality

## PRIOR ROLE — ENTERPRISE PAYMENTS CONTRIBUTIONS (Jan 2024 – Mar 2026)

## Contribution 1: Observability & Grafana Dashboards (Primary Ownership — Signature Work)
This is Luis's most visible individual contribution to the payments platform.

- Built narrative-driven Grafana observability dashboards from scratch for the payments platform
- These dashboards became the standard adopted by VP-level leadership for daily business decision-making
- Automated daily Grafana reports for directors, replacing a manual SQL query that engineers had to run every morning — eliminating early-morning wake-ups for the team
- The automated reports are still running in production today as a relied-upon operational tool
- Created custom Prometheus queries entirely by hand, before AI tooling existed to assist
- Dashboard creation required SLA discussions and cross-team alignment to define meaningful metrics
- This work gave Luis visibility across the organization and demonstrated his ability to translate technical telemetry into business intelligence

## Contribution 2: Card Broker — Core Payment Routing (Major Contributor)
Card Broker was Luis's primary project from before its first store deployment through production stabilization.

- Contributed production Go and Java/Tomcat code to Card Broker, the primary credit/debit card routing service: request validation, duplicate detection, format conversion between upstream clients and downstream processors, and routing to the legacy NonStop or Fiserv proxy path
- Participated in rollout across a 2,300+ store fleet and authored operational runbooks for interrupt rotation
- Supported the full lifecycle: development, testing, rollout, interrupt rotation, observability
- This is the foundational work that proved Luis's value and led to his full-time hire
- To be clear: Luis did not design Card Broker. He was a contributor on the team that built and deployed it.

## Contribution 3: Canonical Log Architecture (Contributor)
- Contributed to the team's canonical log line architecture design discussions
- Specifically influenced the approach by referencing Uber's canonical log pattern (uber/pkg)
- This pattern became the foundation of the dual-write architecture now used across the platform — where each request produces a single wide-format JSON log entry written simultaneously to both the log record and OpenTelemetry span attributes

## Contribution 4: Infrastructure as Code (Contributor From the Start)
- Worked with CDK8s and Terraform for infrastructure-as-code from the beginning of the GKE migration
- Contributed to alert rules and SLO definitions deployed through the IaC pipeline
- Was part of the early migration wave from PCF to GCP when the team was 100% on PCF
- GCP certification directly supported and informed migration decisions

## Contribution 5: Production Reliability & On-Call (Payments era)
- Carried the on-call ("interrupt") rotation for the payments authorization services
- Contributed to production incident response: fast log retrieval, hypothesis generation, and cross-team coordination — across incidents involving Prometheus metric cardinality, circuit-breaker resilience, health-check/liveness-probe design, and upstream dependency timeouts
- Contributed to the resulting blameless postmortems
- Not the root-cause owner or fix author on these incidents — one contributor among the responders

## Contribution 6: PCI-Scope Reduction (Contributor)
- Contributed to modernization off legacy NonStop and to PCI-scope reduction — proxy layers that keep the authorization services out of PCI scope

## Contribution 7: Cardinality & Performance Optimization (Contributor)
- Contributed to Prometheus cardinality containment that reduced series from an unbounded 10,000+ to approximately 280
- The fix replaced unbounded err.Error() label values with a 7-value enumerated set
- Involved in pprof setup and configuration for performance profiling via Pyroscope

## Contribution 8: Production Tracing Remediation (Individual Contribution)
- Remediated critical production tracing blind spots in the Gift Card Tender system
- Re-enabled the OpenTelemetry-to-Tempo pipeline with probabilistic sampling and optimized sampling rates
- Unlocked Tempo trace search by correlation_id, client_id, and transaction_status for the gift card domain

## Contribution 9: Account-to-Account Tender (Code Contributor)
- Contributed production code to the Account-to-Account Tender Service currently running in production
- Participated in design meetings for the service architecture
- Code contributions are in the production repository

## Contribution 10: AI & Innovation (Demonstrated, Not Formally Implemented)
- Presented an AI-powered reliability engineering agent demo during an innovation sprint
- Demonstrated Grafana MCP integration concept to the team
- Was not given formal opportunity to implement despite advocating for inclusion
- The honest framing: Luis showed the concept and advocated for it. The team did not adopt it during his tenure.

## Contribution 11: Knowledge Sharing & Leadership
- Attended AWS re:Invent (fully paid by Daugherty) and brought learnings back to both Home Depot and Daugherty teams
- Taught GCP certification prep classes covering exam tips, product knowledge, and real-world use cases
- Shared conference notes including architectural case studies and how to apply them to company infrastructure
- Recognized as a subject matter resource across both organizations simultaneously

## Contribution 12: Early GCP Migration Pioneer
- Was part of the early migration wave from PCF to GCP when the entire team was still on PCF
- GCP Professional Cloud Architect certification directly supported migration decisions
- This early cloud expertise is what led to being identified for GCP migration work

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 4: CERTIFICATIONS & EDUCATION
# ═══════════════════════════════════════════════════════════════════════════════

## GCP Professional Cloud Architect (2023, Active)
- Pursued independently — realized the associate cert was not required and went straight for the professional exam
- This certification has repeatedly opened doors: informed migration decisions and contributed to the team's cloud strategy
- One of Google Cloud's most rigorous certifications — validates enterprise-grade cloud architecture design

## Other Certifications
- ITIL Foundation (2020) — IT service lifecycle, relevant for payment systems operational maturity

## Education
- B.S. Software Development, Western Governors University (2020–2021) — competency-based, completed in approximately one year (February 2021)
- A.S. Computer Programming and Analysis, Valencia College (2008–2010)

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5: TECHNICAL SKILLS (What Luis Actually Uses)
# ═══════════════════════════════════════════════════════════════════════════════

## Daily Production Stack
- Languages & Backend: Go (primary), Python (current role: Salesforce-metrics services and tooling), Java/Tomcat (legacy payment services), TypeScript/Node.js (portfolio, side projects), REST APIs, SQL
- Cloud & Platform: GCP (Professional Cloud Architect certified) — GKE, Cloud Run, Cloud Build, Pub/Sub, BigQuery, Secret Manager, Cloud KMS; Kubernetes, Pivotal Cloud Foundry, Terraform, Linux
- Reliability & Observability: SRE, OpenTelemetry/OTLP, distributed tracing (Tempo, Jaeger), Prometheus (PromQL), Grafana, Loki, Pyroscope, PagerDuty, SLOs/SLIs, Critical User Journeys, health checks, blameless postmortems, alert-noise reduction, incident response, on-call, pprof profiling
- Data & Delivery: CockroachDB, PostgreSQL, Redis; metrics data modeling (narrow-metric vs star-schema tradeoffs, schema evolution), ETL pipelines; deployment governance (CAB/change management, rollback planning, production-readiness review), branch protection, CI/CD (Jenkins, Spinnaker, GitHub Actions), SonarQube
- Integration & Payments: Salesforce integration, Copado, Apigee, card authorization routing, processor integrations, gift-card systems, PCI-compliance-driven modernization
- Practices: pull-request and design review, automated testing (unit/integration/e2e), production support, release readiness; mentors teammates on AI tooling, MCP, and CI/CD practices

## Growth Areas (Honest)
- Kubernetes depth beyond what CDK8s abstracts
- AI/ML infrastructure and LLM fine-tuning
- Rust (interested, not production experience)
- Full system design ownership (currently contributor-level, targeting architect-level)

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 6: WHAT LUIS IS LOOKING FOR
# ═══════════════════════════════════════════════════════════════════════════════

## Target Roles
Positioning statement: "Software engineer who builds and operates platforms, infrastructure, deployment systems, observability, and developer tooling that allow other engineers and AI-assisted engineering systems to ship software safely and reliably."

- Senior Platform Engineer / Senior Software Engineer, Infrastructure — primary target
- Senior Backend / Distributed Systems Engineer (Go) — strong secondary, core identity
- Site Reliability / Production Engineer — engineering-heavy roles only (building systems, not ticket-driven ops)
- Developer Productivity / Developer Experience / Internal Developer Platform — related platform track
- AI Platform / AI Infrastructure Engineer — adjacent, high-upside (real interest, limited shipped AI product evidence)
- Senior Full-Stack Engineer — secondary
- Never position him as an operations-only SRE or traditional DevOps admin — the work has to be building systems

## Best-Fit Companies
- Companies that value reliability engineering, observability, and production operations
- Teams migrating from legacy to cloud-native architectures
- Startups or scale-ups that need a senior operator to turn AI ideas into real infrastructure
- Organizations where the unglamorous critical work (on-call, alert quality, deployment governance) is respected
- Fintech, payments, e-commerce, or any domain where systems cannot go down
- Companies that want honest engineers who describe their actual contributions

## Not a Good Fit
- Companies that want inflated claims or architects who only draw diagrams
- Roles that are primarily frontend with no backend systems work
- Organizations where engineering is a cost center

## Location & Work Style
- Based in Parrish, FL (Tampa Bay area), Eastern Time
- Default: remote, U.S.-based. Not open to relocation.
- Light hybrid (up to 2 days/week) is workable only for an office within a reasonable commute of Parrish — Bradenton, Sarasota, Lakewood Ranch, St. Petersburg, Brandon/Riverview, or downtown Tampa — and only when comp and work-life balance are both strong
- Roles requiring a security clearance are not a fit
- US work authorized, no sponsorship required

## Compensation
- Market rate for experienced backend/distributed systems engineers
- Evaluates total comp (base + equity + bonus + benefits)

## Why Now?
- Contract-to-full-time conversion (Jan 2024) proved his value; he is looking for the next step where he can have larger ownership and influence on architecture.
- He has consistently operated above his title (observability ownership, production operations, security advocacy); he wants a role that formally reflects that scope.

## VP Hiring Readout (Honest Calibration)
If a VP of Engineering, CTO, or Head of Platform asks whether Luis is a fit for Staff or Principal, the honest answer is:

- Strong hire for Staff-level roles in platform, observability, reliability, cloud migration, or payments-adjacent distributed systems.
- Credible Principal-track hire when the company wants a hands-on systems operator who can grow into broader architectural authority over the next 12-24 months.
- Less proven for a pure "already operating as company-wide Principal" seat that requires repeated cross-org architecture ownership across multiple independent teams.

### Why a VP would hire him
- He has production scar tissue in a zero-downtime payments environment, not just design-theory knowledge.
- He turns fuzzy operational pain into dashboards, traces, runbooks, and measurable control loops.
- He has already earned leadership trust through tooling that VP-level stakeholders actually use.
- He is comfortable with the work many senior engineers avoid: interrupt rotation, remediation, incident debugging, compliance cleanup, and migration support.
- He can bridge cloud architecture conversations with implementation detail instead of staying at slideware altitude.

### What still needs to be proven for top-end principal scope
- Repeated ownership of architecture direction across several teams, not just within one domain.
- A visible public proof point for edge-to-cloud AI systems that goes beyond concept demos and portfolio intent.
- More evidence of setting technical direction that other senior engineers adopt without direct manager intervention.

### Best level framing in interviews
- "Senior" is the baseline — clear fit today for senior backend/platform/infra roles.
- "Staff now" is the strongest and easiest stretch case.
- "Principal-track" is credible when the role values systems judgment, reliability, and migration leadership over org-chart title purity.
- Do not oversell him as having already been the sole architect of an enterprise platform.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 7: FAQ — HONEST ANSWERS
# ═══════════════════════════════════════════════════════════════════════════════

### "Did Luis build the payments platform?"
No. Luis was one of many engineers on the Enterprise Payments Platform team (Jan 2024 – Mar 2026, plus about two years before that as a Daugherty contractor). He did not architect the platform. He worked within it. His specific contributions were in observability dashboards, Card Broker development, and production operations. He is now an SRE on Home Services. See Section 3 for exactly what he did.

### "What is Luis's biggest personal contribution?"
Depends on the era. On Home Services (current): he built the transaction-metrics ETL application end to end (design, schema, CI/CD, production readiness) — including cutting his own over-engineered star-schema once he validated the real Grafana/alerting query patterns — and he drove the first application through the new CI/CD governance path, making it the repeatable pattern. On Enterprise Payments: he built narrative-driven Grafana observability dashboards from scratch that VP-level leadership adopted for daily business decisions, and his automated daily reports replaced a manual early-morning SQL process. Same instinct in both: make critical systems measurable and safer to operate.

### "What was Luis's title before SRE?"
Luis's career path was non-traditional. Before enterprise engineering, he ran an independent freelance software consultancy (Menez Enterprises, Sep 2018 – Apr 2022), and before that worked as a Web Developer at a real-estate company (G World Properties, Sep 2015 – Sep 2018). He joined The Home Depot as a contractor in April 2022, was hired full-time as a Software Engineer II on Enterprise Payments in January 2024, and moved to Site Reliability Engineer on Home Services in March 2026 — his current role.

### "Would a VP hire Luis as Staff or Principal?"
Most likely as Staff today, and as Principal-track in the right organization.

The strongest hiring case is Staff-level platform, observability, reliability, or cloud architecture work because Luis already has the right operating profile: he has built leadership-facing dashboards, handled interrupt rotation in a platinum-tier environment, contributed to high-throughput routing systems, and improved security and telemetry in production.

Principal is credible when the company wants a very hands-on architect/operator rather than someone who has already spent years in a formal principal title. The honest gap is repeated organization-wide technical direction across multiple teams and a larger body of public proof points for edge-to-cloud AI systems.

### "What about the AI reliability agent?"
Honest answer: Luis demoed an AI-powered reliability engineering agent concept during an innovation sprint and advocated for its implementation. The team did not adopt it during his tenure. He showed the concept, it was not implemented.

### "Does Luis know Go?"
Yes. Go is a primary language for him. He has contributed production Go code to Card Broker and Account-to-Account Tender, worked with Go-based gift-card tender microservices, and currently develops Go tooling for OpenTelemetry tracing and telemetry quality. His Go experience is in the context of high-throughput payment systems and platform tooling.

### "How many years of experience does Luis have?"
About five years at enterprise scale (2022–present) on top of earlier web-development work from 2015: roughly two years as a Daugherty contractor at The Home Depot (Apr 2022 – Jan 2024), then Software Engineer II on Enterprise Payments (Jan 2024 – Mar 2026), then SRE on Home Services (Mar 2026 – present). He has been writing production Go since mid-2022. Earlier drafts claiming 10+ years were corrected.

### "Is Luis open to new opportunities?"
Yes, selectively. Primary targets: senior platform/infrastructure engineering roles. Strong secondary: senior backend/distributed-systems roles in Go. He also considers engineering-heavy SRE roles and AI platform/infrastructure work where his observability, production operations, GCP, and cloud migration background creates immediate value.

### "Work authorization?"
US work authorized. No sponsorship required.

### "Notice period?"
About two weeks (14 days).

### "Why is Luis looking for a new role?"
Luis is seeking senior platform/infrastructure engineering roles primarily — with senior backend/distributed-systems engineering (Go) as a strong secondary — where he can keep building production code and tooling alongside reliability and observability work. He started as a contractor in April 2022 and went full-time in January 2024; he built payment services in Go and Java, then moved into SRE on Home Services in March 2026, owning deployment governance, telemetry, and SLOs. He wants a role with predictable, limited on-call — remote U.S., or a light hybrid role within commuting distance of his home in Parrish, FL.

### "Is Luis ready for a senior role?"
Yes — he's a strong fit for senior backend/platform/SRE roles today based on his production experience:
- Go authorization services on CockroachDB across a 2,300+ store rollout; Gift Card Tender from initial design onward.
- Deployment governance: drove a production change through CAB approval solo and made it the repeatable CI/CD governance pattern for later applications.
- Observability ownership: owned a transaction-metrics ETL app end to end; helped define SLOs, Critical User Journeys, and a leadership-facing monitoring model.
- Alert quality: cut recurring false-positive alerts by replacing time-based muting with volume-aware thresholds.
- Cloud: GCP Professional Cloud Architect certified.
- Two Home Depot Bravo awards (pipeline recovery; production incident response).

### "What kind of work does Luis want?"
Platform, infrastructure, and backend engineering: Go/Python services and tooling, deployment systems and governance, observability architecture, and incident response. He wants to build the systems that let other engineers (and AI-assisted engineering workflows) ship software safely, while still writing backend code. Payments, e-commerce, or any domain where systems can't go down. Teams that respect engineers who describe their actual contributions, not inflated claims.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 8: THIS PORTFOLIO SITE (gimenez.dev)
# ═══════════════════════════════════════════════════════════════════════════════
# If a recruiter asks about the site's architecture, the assistant may briefly describe it and tie it to Luis's skills.

## Tech Stack
- Next.js 16 (App Router), React 19, TypeScript, Tailwind. Deployed via self-hosted Coolify on a small ARM server, behind a Cloudflare Tunnel, with GitHub Actions driving CI/CD (lint, build, unit tests, Cypress against production, then a Coolify deploy trigger on merge to main).
- This chat: RAG over the knowledge base you are reading — embeddings via Cloudflare Workers AI (bge-m3) with vector search in Cloudflare Vectorize (free tier), plus file-based section retrieval as an automatic fallback. Inference via OpenAI-compatible API (self-hosted Inferencia router on the home lab, proxying to Ollama on a Mac over the LAN), with OpenRouter and Cloudflare Workers AI as cloud fallbacks. Rate limiting, prompt-injection defense, session analytics in Firestore.
- Observability: in-memory metrics, War Room dashboard, Prometheus /api/metrics, structured logs.

## Why It Matters for Recruiters
The site is a live production system demonstrating the same practices Luis uses at scale: observability, rate limiting, and RAG-backed AI, plus self-hosted infrastructure and CI/CD he runs himself end to end. Built and maintained by Luis as a portfolio and lead-generation tool.

The strongest portfolio reading is not "he can build a website." It is "he can package operating judgment, cloud infrastructure, and technical narrative into a system that explains how he works." That is useful hiring signal for Staff and Principal-track roles.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 9: AI BEHAVIOR RULES
# ═══════════════════════════════════════════════════════════════════════════════

## Honesty Rules
1. NEVER claim Luis built, designed, or architected the entire payments platform or the Home Services platform.
2. ALWAYS use "contributed to", "worked within", "supported", "operated across" for team efforts.
3. For personal contributions (dashboards, ETL ownership, tracing work), use "built", "created", "owned", "helped define".
4. If a recruiter asks "did you build this?", respond: "No, Luis was part of a large team. Here is what he specifically contributed: [list from Section 3]."
5. Frame the ENVIRONMENT scale for context, then pivot to PERSONAL contributions.
6. The AI reliability agent was demoed, NOT implemented. Be honest about this.
7. If asked about this site's architecture or tech stack (gimenez.dev), you may briefly describe it using Section 8 (Next.js, self-hosted Coolify, Cloudflare RAG, observability) and connect it to Luis's skills; then offer to elaborate on his background.
8. Compensation: never invent or quote numbers, target ranges, or a walk-away floor. Say Luis prefers to discuss compensation directly (luisgimenezdev@gmail.com); keep any market framing general.
9. Never position him as an operations-only SRE or ticket-driven DevOps admin. Lead with systems he built or migrated: the metrics-ETL app, the CAB/CI-CD governance pattern, the alert-quality system, the observability dashboards.

## Tone
- "I know this ecosystem because I have debugged it at 2 AM on interrupt rotation."
- "I did not build the platform; I helped keep it alive and make it observable."
- "When directors needed daily transaction visibility, I helped automate it."
- Confident but grounded. The engineer who does the work, not the one who takes credit.

## Contact
- Email: luisgimenezdev@gmail.com
- GitHub: github.com/menezmethod
- LinkedIn: linkedin.com/in/gimenezdev
- Portfolio: gimenez.dev

## Sound Bites (for natural answers)
- "He moved from Enterprise Payments to SRE on Home Services in March 2026 — same instinct for making systems observable, different scope."
- "He wants teams that value the unglamorous work: on-call, alert quality, deployment governance — the work that keeps systems up at 2 AM."
- "His signature work is the leadership-facing monitoring model — SLOs, Critical User Journeys, and the Grafana/BigQuery reporting that shows which applications are healthy."
- "He didn't build the whole platform; he helped keep it alive and made it observable."
- "When asked about this site: it's Next.js, self-hosted on his own Coolify setup behind Cloudflare, with RAG and the same observability and security practices he uses in production."
`;
