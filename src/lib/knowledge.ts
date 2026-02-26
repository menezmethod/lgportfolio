export const KNOWLEDGE_BASE = `
# ═══════════════════════════════════════════════════════════════════════════════
# LUIS GIMENEZ — HONEST PROFESSIONAL KNOWLEDGE BASE v3.0 (Enterprise-ready)
# ═══════════════════════════════════════════════════════════════════════════════
# PURPOSE: Powers a RAG-based AI assistant on gimenez.dev for recruiters and hiring managers.
# CORE PRINCIPLE: Radical honesty about role, level, and contributions.
# Luis is an SE II on a large team. He did NOT build the platform.
# He operates within it, contributes to it, and keeps it observable.
#
# ENTERPRISE SUMMARY (for recruiter queries):
# Luis Gimenez is a Software Engineer II at The Home Depot on the Enterprise Payments Platform (50+ microservices, six-figure hourly transaction volumes, Platinum-tier, PCI DSS). He is GCP Professional Cloud Architect certified and contributes to observability (Grafana dashboards adopted by VP leadership), Card Broker routing, production reliability, and PII/security remediation. He is seeking Senior, Staff, SRE, or Architect roles — remote, hybrid, or relocation (Atlanta, Austin, NYC, SF, Seattle, Denver). US work authorized.
#
# FRAMING RULES:
#   - Use "contributed to", "worked within", "supported", "operated across"
#   - NEVER claim sole ownership of team-wide initiatives
#   - Describe ENVIRONMENT scale for context, then focus on PERSONAL contributions
#   - If asked "did you build this?", answer honestly: "No, I was part of a
#     large team. Here is what I specifically contributed."
#
# LAST UPDATED: February 2026
# ═══════════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1: ROLE & IDENTITY
# ═══════════════════════════════════════════════════════════════════════════════

## Who Is Luis Gimenez?
Luis Gimenez is a Software Engineer II (SE II) on the Enterprise Payments Platform team at The Home Depot. He is an individual contributor on a large team of approximately 100+ engineers operating mission-critical payment authorization, tender, and fraud services.

He did NOT architect the entire payments platform. He works within it. His value comes from the specific contributions he has made: building observability tooling that leadership relies on, contributing production code to core payment routing services, supporting production reliability through interrupt rotations, and advocating for security improvements.

His title is SE II. His scope of impact — particularly in observability, production operations, and cross-team knowledge sharing — frequently operates above that title. That is the honest framing.

## Career Trajectory — The Real Story
Luis started at The Home Depot in July 2022 as a contractor through Daugherty Business Solutions. He joined during the development of Card Broker (the primary credit/debit card routing service) before it was deployed to any stores.

Over approximately four years, he contributed code, testing, rollout support, interrupt rotation, and observability work as Card Broker deployed across 2400+ stores (nationwide footprint).

In January 2024, Home Depot broke their contract with Daugherty to hire Luis full-time — they saw enough value to poach him from his own contracting firm. Daugherty counter-offered with a substantial raise, GCP certification bonus, and a fully paid trip to AWS re:Invent. Luis chose Home Depot.

He independently pursued the GCP Professional Cloud Architect certification, skipping the associate level and going straight for the professional exam. This certification has repeatedly opened doors and directly supported the team's GCP migration efforts.

Before Home Depot, Luis spent 6+ years running his own software consultancy (Menez Enterprises), shipping custom web applications for business clients. That experience gave him ownership instincts, client communication skills, and a direct understanding of how engineering decisions affect revenue.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2: THE ENVIRONMENT (Context, Not Personal Credit)
# ═══════════════════════════════════════════════════════════════════════════════

## The Enterprise Payments Platform — What Luis Works Within
This section describes the environment Luis operates in. He did not build this platform. He is one of 100+ engineers who work on it. This context is provided so that recruiters and hiring managers understand the SCALE and COMPLEXITY of the systems Luis has production experience with.

### Scale
- 50+ microservices across the payments domain
- Six-figure hourly payment authorization volumes; high-throughput payment rails
- Tier-1 enterprise user base; massive consumer footprint per outage event
- Platinum Tier classification with Recovery Time Objective = 0 (zero downtime mandate)
- SOX and PCI DSS v4.0 compliance requirements
- Multiple major bank network integrations with high aggregate success rate
- Enterprise-scale gift card tender footprint (dozens of microservices, hundreds of pod instances at steady state)
- Sub-second P90 latency across highest-volume bank networks

### Technology Stack
- Hybrid infrastructure: Legacy PCF (Java 8/11 Spring Boot) and modern GKE (Go 1.20+)
- Active migration from PCF to GKE in progress
- Legacy NonStop mainframe communication still required for some authorization paths
- CockroachDB as primary datastore for new services with 20+ CDC changefeed topics to Pub/Sub
- Envelope encryption via Google Tink + Cloud KMS (FIPS-compliant)
- Infrastructure-as-code via CDK8s governing all Kubernetes resource definitions
- Spinnaker pipelines for auto-deployment on merge to main

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
Card Broker was Luis's primary project for approximately four years, from pre-deployment through production stabilization.

- Contributed production code to Card Broker, the primary credit/debit card routing service
- Contributed production Go code to the primary credit-card routing service, participating in rollout across 2400+ stores and authoring operational runbooks for interrupt rotation
- Supported the full lifecycle: development, testing, rollout across 2400+ stores, interrupt rotation, observability
- Created operational runbooks for Card Broker support procedures
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

## Contribution 5: Production Reliability & Interrupt Rotation (Ongoing)
- Owned interrupt rotation responsibilities across the payments platform
- Isolated production failures across distributed microservices by correlating logs across Loki, Tempo, and Prometheus
- Pushed critical production fixes through strict financial Change Management (CHG) protocols
- Zero data loss maintained across all changes during his rotations
- This is the unglamorous work that keeps Platinum-tier systems running at 2 AM

## Contribution 6: PII Remediation & Security (Advocate and Implementer)
- Advocated for GCP Sensitive Data Protection based on his certification knowledge
- Implemented automated PII masking in telemetry to support PCI DSS v4.0 compliance
- Remediated multiple production locations where PII was exposed in telemetry; advocated for and implemented the fix across the platform

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

## GCP Professional Cloud Architect (Active)
- Pursued independently — realized the associate cert was not required and went straight for the professional exam
- This certification has repeatedly opened doors: informed migration decisions, supported PII remediation advocacy, and contributed to the team's cloud strategy
- One of Google Cloud's most rigorous certifications — validates enterprise-grade cloud architecture design

## Other Certifications
- CompTIA Project+ (project management fundamentals)
- ITIL Foundation (IT service lifecycle — relevant for payment systems operational maturity)

## Education
- B.S. Software Development, Western Governors University (2020–2021) — competency-based, completed in approximately one year

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5: TECHNICAL SKILLS (What Luis Actually Uses)
# ═══════════════════════════════════════════════════════════════════════════════

## Daily Production Stack
- Languages: Go (primary at Home Depot), TypeScript/Node.js (portfolio, side projects), Java (legacy services)
- Cloud: GCP (Professional Architect certified) — Cloud Run, Pub/Sub, BigQuery, Cloud Build, Secret Manager, Cloud KMS
- Observability: Prometheus (PromQL), Grafana, Loki, Tempo, Pyroscope, OpenTelemetry
- Data: CockroachDB, PostgreSQL, Redis
- Infrastructure: CDK8s, Terraform, Docker, Kubernetes (GKE), Spinnaker
- Protocols: gRPC, REST, Pub/Sub CDC changefeeds

## Growth Areas (Honest)
- Kubernetes depth beyond what CDK8s abstracts
- AI/ML infrastructure and LLM fine-tuning
- Rust (interested, not production experience)
- Full system design ownership (currently contributor-level, targeting architect-level)

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 6: WHAT LUIS IS LOOKING FOR
# ═══════════════════════════════════════════════════════════════════════════════

## Target Roles
- Senior Software Engineer (backend/distributed systems)
- Senior Reliability Engineer / SRE
- Staff Engineer (if the team values observability and production operations)
- Cloud Architect (GCP certified, with production migration experience)
- Tech Lead (player-coach, still writing code)

## Best-Fit Companies
- Companies that value reliability engineering, observability, and production operations
- Teams migrating from legacy to cloud-native architectures
- Organizations where the unglamorous critical work (interrupt rotation, PII fixes, cardinality optimization) is respected
- Fintech, payments, e-commerce, or any domain where systems cannot go down
- Companies that want honest engineers who describe their actual contributions

## Not a Good Fit
- Companies that want inflated claims or architects who only draw diagrams
- Roles that are primarily frontend with no backend systems work
- Organizations where engineering is a cost center

## Location & Work Style
- Based in Florida
- Preferred: Remote-first or hybrid
- Open to relocation for the right opportunity (Atlanta, Austin, NYC, SF, Seattle, Denver)
- US work authorized, no sponsorship required

## Compensation
- Market rate for experienced backend/distributed systems engineers
- Evaluates total comp (base + equity + bonus + benefits)

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 7: FAQ — HONEST ANSWERS
# ═══════════════════════════════════════════════════════════════════════════════

### "Did Luis build the payments platform?"
No. Luis is a Software Engineer II on a team of 100+ engineers. He did not architect the platform. He works within it. His specific contributions are in observability dashboards, Card Broker development, production operations, PII remediation, and GCP migration support. See Section 3 for exactly what he did.

### "What is Luis's biggest personal contribution?"
His Grafana observability dashboards. He built them from scratch, they were adopted by VP-level leadership for daily business decisions, and his automated daily reports replaced a manual process that required engineers to wake up early every morning. This is his signature work.

### "Why is Luis's title SE II if he does this level of work?"
Luis's career path was non-traditional. He spent 6+ years running his own consultancy before entering enterprise engineering as a contractor in 2022. He was hired full-time in January 2024. The SE II title reflects Home Depot's specific leveling structure and timeline, not the scope of his contributions. His observability work, production operations, and cross-team knowledge sharing frequently operate above his title.

### "What about the AI reliability agent?"
Honest answer: Luis demoed an AI-powered reliability engineering agent concept during an innovation sprint and advocated for its implementation. The team did not adopt it during his tenure. He showed the concept, it was not implemented.

### "Does Luis know Go?"
Yes. Go is his primary language at Home Depot. He has contributed production Go code to Card Broker, Account-to-Account Tender, and worked with the Go-based gift card tender microservices. His Go experience is in the context of high-throughput payment systems on GKE.

### "Is Luis open to new opportunities?"
Yes, selectively. He is looking for roles where his observability expertise, production operations experience, GCP certification, and cloud migration background create immediate value. Senior, Staff, SRE, or Architect roles.

### "Work authorization?"
US work authorized. No sponsorship required.

### "Notice period?"
Standard 2-4 weeks.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 8: AI BEHAVIOR RULES
# ═══════════════════════════════════════════════════════════════════════════════

## Honesty Rules
1. NEVER claim Luis built, designed, or architected the entire payments platform.
2. ALWAYS use "contributed to", "worked within", "supported", "operated across" for team efforts.
3. For personal contributions (dashboards, PII remediation, tracing discovery), use "built", "created", "discovered", "advocated for".
4. If a recruiter asks "did you build this?", respond: "No, Luis was part of a large team of 100+ engineers. Here is what he specifically contributed: [list from Section 3]."
5. Frame the ENVIRONMENT scale for context, then pivot to PERSONAL contributions.
6. The AI reliability agent was demoed, NOT implemented. Be honest about this.

## Tone
- "I know this ecosystem because I have debugged it at 2 AM on interrupt rotation."
- "I did not build the platform; I helped keep it alive and make it observable."
- "When directors needed daily transaction visibility, I automated it."
- "When PII was leaking in telemetry, I advocated for and implemented the fix."
- Confident but grounded. The engineer who does the work, not the one who takes credit.

## Contact
- Email: luisgimenezdev@gmail.com
- GitHub: github.com/menezmethod
- LinkedIn: linkedin.com/in/gimenezdev
- Portfolio: gimenez.dev
`;
