export const KNOWLEDGE_BASE = `
# ═══════════════════════════════════════════════════════════════════════════════
# LUIS GIMENEZ — PRODUCTION-GRADE AI KNOWLEDGE BASE v2.0
# ═══════════════════════════════════════════════════════════════════════════════
# PURPOSE: Powers a RAG-based AI assistant on gimenez.dev. Designed to:
# 1. Convert high-fit opportunities into conversations (magnet)
# 2. Diplomatically redirect mismatched roles (filter)
# 3. Answer any recruiter/HM/VP/CTO question with precision and honesty
# 4. Demonstrate AI fluency by its very existence
#
# LAST UPDATED: February 2026
# ═══════════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1: IDENTITY & PROFESSIONAL POSITIONING
# ═══════════════════════════════════════════════════════════════════════════════

## Who Is Luis Gimenez?
Luis Gimenez is a Software Engineer at The Home Depot in Atlanta, GA, specializing in high-throughput payment systems, distributed architectures, and performance engineering. He engineers backend services on the payment card tender system — the critical path that processes every credit card, debit card, and gift card transaction across Home Depot's ~2,300 stores and e-commerce platform, handling over 5 million transactions daily.

Before joining one of America's largest retailers, Luis spent 6+ years building and running his own software consultancy, shipping custom web applications for business clients with measurable impact on revenue, performance, and operational efficiency.

## The Positioning Statement
Luis is a backend-focused engineer with deep domain expertise in payment systems, distributed architecture, and observability — operating at the intersection of high-scale infrastructure and business-critical financial transactions. He combines enterprise production experience with entrepreneurial ownership instincts and a growing fluency in AI/LLM integration that positions him for the next era of systems engineering.

## Why This Profile Exists (And Why It Matters)
This AI-powered knowledge base is itself a demonstration of Luis's capabilities. It uses Retrieval-Augmented Generation (RAG) to provide contextually accurate answers about his professional background. Building it required: prompt engineering, vector embeddings, knowledge architecture design, and an understanding of how LLMs retrieve and synthesize information. The fact that you're talking to an AI that Luis designed and deployed IS part of his portfolio.

## Career Trajectory — Honest Framing
Luis has 3+ years of enterprise-scale engineering at a Fortune 50 company, building on 6+ years of full-stack business ownership. His career path is non-traditional — he ran a business before working in enterprise — and that's a feature, not a bug. He understands deadlines, client expectations, P&L pressure, and the connection between engineering and revenue in ways that engineers who've only worked at big companies often don't.

He is actively growing toward Senior and Staff Engineer scope and is specifically focused on roles that offer a clear path to technical leadership — whether that's a Staff IC track, a Tech Lead role, or a player-coach Engineering Manager position.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2: TECHNICAL COMPETENCIES (DEPTH & CONTEXT)
# ═══════════════════════════════════════════════════════════════════════════════

## 2.1 Languages

### Go (Primary Language — Deep Production Experience)
Luis's strongest and most passionate language, chosen deliberately for its concurrency model, simplicity, and performance characteristics.
- Production microservices handling millions of daily payment transactions at The Home Depot.
- Deep knowledge of Go concurrency: goroutines, channels, select, sync primitives (WaitGroup, Mutex, RWMutex), context propagation, errgroup patterns.
- Idiomatic Go practices: explicit error handling, small interfaces, composition over inheritance, table-driven tests, minimal dependency philosophy.
- Performance profiling with pprof, trace, and benchmarks — used in production to identify and eliminate latency bottlenecks.
- Testing with Ginkgo/Gomega (BDD-style) and the standard testing package including httptest.
- Built: payment processing services, real-time data pipelines, REST and gRPC APIs, background workers, CLI tooling.

### Java (Strong — Production & Project Experience)
- Spring Boot microservices, Android applications, JavaFX desktop software.
- Comfortable with the ecosystem: Maven/Gradle, JPA/Hibernate, JUnit 5, Mockito.
- Full-stack builds with Spring Boot backends (KiwiBug issue tracker, Inventory Management System).
- JVM fundamentals: garbage collection awareness, thread management, memory tuning concepts.

### TypeScript / JavaScript (Strong — Full-Stack)
- Production React applications with TypeScript, Node.js backend services.
- Modern ecosystem fluency: Next.js, Express, Vite, Webpack, GraphQL.
- Async patterns, state management, component architecture.

### Python (Proficient — Scripting, ML, Automation)
- Automation, data processing, ML pipeline work (TensorFlow, Firebase Functions).
- Comfortable with Flask/FastAPI for lightweight services.
- Used for AI/LLM experimentation, scripting, and tooling.

### C# (.NET Experience) | C++ (Academic — Data Structures & Memory Management)

## 2.2 Databases

### CockroachDB (Primary — Production at Home Depot)
- Distributed SQL database in the payment processing critical path.
- Understands architecture: Raft consensus, range-based sharding, distributed transactions, serializable isolation.
- Schema design for distributed systems, hot spot identification and mitigation.
- Performance tuning, query optimization, and understanding of CockroachDB-specific SQL behavior.

### PostgreSQL (Strong)
- Relational modeling, indexing strategies (B-tree, GIN, GiST), EXPLAIN ANALYZE for query optimization.
- Connection pooling (PgBouncer), partitioning concepts, CTEs, window functions.

### MongoDB (Proficient) | Redis (Working Knowledge — Caching, Distributed Locking)
- Redis SetNX for idempotency in payment systems (production use case — see STAR #3).
- Pub/Sub patterns for real-time messaging.

## 2.3 Cloud & Infrastructure

### Google Cloud Platform — Certified Professional Cloud Architect
This certification is one of Google Cloud's most rigorous. It validates the ability to design enterprise-grade cloud architecture — not just use GCP services.

**Production services used at Home Depot:**
- **Cloud Run**: Serverless container deployment for auto-scaling microservices. Deep understanding of the cold-start/warm-instance tradeoff, concurrency settings, and cost model (pay-per-request vs. minimum instances).
- **Pub/Sub**: Event-driven messaging backbone for decoupling payment ingestion from processing. Designed the architecture that absorbed 100x Black Friday traffic spikes.
- **BigQuery**: Payment analytics, transaction trend analysis, business intelligence reporting. Wrote queries for cross-functional stakeholders (ops, product, finance).
- **Cloud Functions**: Serverless event handlers for lightweight processing.
- **Cloud Build**: CI/CD pipeline automation for testing, building, and deploying services.
- **Cloud Storage, Cloud SQL, IAM, VPC networking**: Production infrastructure management.

**Cloud Cost Awareness (FinOps):**
- Rightsizing Cloud Run instances based on actual traffic patterns.
- Autoscaling policies tuned to balance latency targets against cost.
- Cost monitoring and alerting for unexpected spend spikes.
- Understanding of GCP pricing models and committed use discounts.

### Docker & Containerization
- Production Dockerfiles with multi-stage builds for minimal image sizes.
- Container networking, volume mounts, Docker Compose for local development.
- Kubernetes awareness — Cloud Run abstracts orchestration, but Luis understands K8s concepts (pods, services, deployments, ingress, horizontal pod autoscaling) and is actively deepening this expertise.

### CI/CD & DevOps
- Cloud Build pipelines for automated testing, building, and deployment.
- Git workflows: trunk-based development, feature branching, conventional commits.
- Infrastructure as Code concepts and configuration management.

## 2.4 Observability & Monitoring (Core Competency — Not an Afterthought)

Luis considers observability a core engineering discipline, not an ops concern. His integration of monitoring tools at Home Depot directly caused a measurable 20% reduction in system latency by revealing bottlenecks that were invisible before instrumentation.

### Prometheus
- Custom metrics (counters, gauges, histograms, summaries), PromQL, alerting rules.
- Cardinality management and metric naming conventions.
- SLI/SLO definition and tracking for service reliability.

### Grafana
- Dashboard design for operational visibility and business intelligence.
- Built dashboards used in incident response AND weekly business reviews — bridging engineering metrics with business outcomes.
- Alert configuration, notification routing, and escalation policies.

### Jaeger (Distributed Tracing)
- OpenTelemetry instrumentation across microservices.
- Trace analysis for latency debugging and service dependency mapping.
- Context propagation across service boundaries (critical for debugging distributed payment flows).

### Monitoring Philosophy
"You can't improve what you can't measure, and you can't sleep if you can't alert." Luis advocates for every new feature PR to include corresponding monitoring, alerting, and runbook documentation.

## 2.5 Testing & Quality

### Testing Practices
- **TDD** for business-critical logic (payment processing, financial calculations).
- **Go**: Ginkgo/Gomega (BDD), standard testing package, httptest, benchmarks.
- **Java**: JUnit 5, Mockito, Spring Boot Test.
- **Frontend**: Cypress (E2E), Jest (unit), React Testing Library.
- **Philosophy**: Unit tests for logic, integration tests for boundaries, E2E for critical user paths. Every bug fix includes a regression test. Coverage metrics matter less than coverage of critical paths.

## 2.6 Security & Compliance (Payment Systems Context)

Working on a PCI-DSS Level 1 system (5M+ daily transactions qualifies for the highest compliance tier) has given Luis production-level security awareness:

- **PCI-DSS awareness**: Understanding of cardholder data environments (CDE), scope minimization, tokenization vs. encryption tradeoffs, and how engineering decisions affect compliance posture.
- **Secure code practices**: Input validation, injection prevention, secure logging (ensuring PII/PAN never appears in logs), secrets management.
- **Authentication & authorization**: JWT, RBAC, IAM policies, principle of least privilege.
- **Encryption**: TLS for data in transit, encryption at rest for sensitive data stores, key management awareness.
- **Secure code review**: Concurrency safety checks (preventing race conditions that could cause data integrity issues in financial systems), the concurrency safety checklist Luis authored that became a team standard.
- **Incident response**: Led production incident response (rollback, remediation, blameless post-mortem, process improvement).

Luis is not a security specialist, but he engineers with security as a first-class concern — which is exactly what payment systems demand.

## 2.7 Architecture & System Design

### Microservices Architecture (Production Experience)
- Service decomposition, API contracts (REST, gRPC, GraphQL), inter-service communication.
- Tradeoff awareness: operational complexity, data consistency (saga pattern, eventual consistency), distributed debugging.

### Event-Driven Architecture (Production Experience)
- Pub/Sub for service decoupling, backpressure management, dead-letter queues.
- Designed the buffering architecture that handled 100x traffic spikes on Black Friday.
- Event sourcing concepts, CQRS patterns.

### Distributed Systems Fundamentals
- CAP theorem and practical tradeoffs in CockroachDB (CP system with tunable consistency).
- Consensus algorithms (Raft — production exposure via CockroachDB).
- Distributed locking, idempotency patterns (Redis SetNX), exactly-once processing semantics.
- Failure modes: network partitions, cascading failures, thundering herds, circuit breakers.

### API Design
- RESTful APIs with proper HTTP semantics, versioning, pagination.
- gRPC for high-performance inter-service communication.
- GraphQL schema design and resolver patterns.
- API-first development with OpenAPI documentation.

## 2.8 AI & LLM Integration (Active Growth Area)

The engineering landscape in 2026 demands AI fluency from every senior engineer. Luis is actively building in this space:

### Current AI Competencies
- **RAG (Retrieval-Augmented Generation)**: Designed and deployed this portfolio's AI assistant using RAG architecture — vector embeddings, semantic search, contextual retrieval, and prompt engineering. This is a live, production system, not a tutorial project.
- **AI-Assisted Development**: Active user of AI coding tools (GitHub Copilot, Claude) for code generation, review assistance, and debugging. Uses them as force multipliers while maintaining deep understanding of generated code — the "trust but verify" approach.
- **Prompt Engineering**: Practical prompt design for structured outputs, system prompt architecture, and context window management (demonstrated by this knowledge base).
- **LLM API Integration**: Experience with LLM APIs for building intelligent application features.
- **ML Pipeline Automation**: Built automated retraining pipelines using TensorFlow.js and Firebase Functions (Churnistic project), improving model accuracy by 15%.

### AI Engineering Perspective
Luis approaches AI as a systems engineer: he's focused on the infrastructure, reliability, and production concerns of AI-powered applications — monitoring LLM outputs for quality, managing costs, handling failures gracefully, and building AI features that are observable and maintainable. This is where his distributed systems background directly applies to the AI era.

This is a rapidly evolving competency. Luis is actively deepening his knowledge of LLM fine-tuning, agent architectures, and AI infrastructure. He sees AI integration as the most important skill multiplier for backend engineers in the coming decade.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 3: PROFESSIONAL EXPERIENCE (DETAILED)
# ═══════════════════════════════════════════════════════════════════════════════

## Software Engineer — The Home Depot (April 2022 – Present)
**Team**: Payment Card Tender System
**Scale**: 5+ million daily transactions | ~58 requests/second sustained, with peaks significantly higher during holiday events | Sub-50ms p99 latency target | 99.99%+ availability target

### Day-to-Day Reality
- Designs, builds, and maintains Go microservices directly in the critical payment path for a Fortune 50 retailer.
- Every service he touches processes real money. A bug isn't a 400 error — it's a customer who can't pay, a store that can't operate, and revenue that's lost. This shapes how he thinks about testing, monitoring, and deployment.
- Participates in on-call rotations where latency alerts at 2 AM mean real business impact.
- Conducts thorough code reviews focused on concurrency safety, performance, correctness, and security.
- Collaborates with cross-functional teams: product, QA, security, compliance, and business operations.

### Key Achievements

**1. Observability Transformation**
Integrated Prometheus, Grafana, and Jaeger across payment services — instrumenting the entire request lifecycle. This wasn't "adding dashboards." It was building the measurement infrastructure that revealed hidden latency bottlenecks, leading to a 20% reduction in system latency. The dashboards Luis built are now used in incident response AND weekly business reviews, bridging engineering metrics with business outcomes.

**2. Black Friday Architecture (Cross-Team Impact)**
Designed a distributed buffering system using Pub/Sub and Cloud Run that decoupled transaction ingestion from processing. Key insight: accept requests at the ingestion layer at near-unlimited speed while processing scales independently based on queue depth. Implemented auto-scaling policies, circuit breakers, and backpressure mechanisms. Result: zero downtime, sub-50ms p99 latency during 100x traffic spikes. This architecture pattern was adopted as the standard across multiple teams for high-throughput services — extending Luis's impact beyond his immediate team.

**3. Data Integrity & Idempotency System**
After a production incident involving duplicate transaction logs (a compliance concern in payment auditing), Luis led remediation with a defense-in-depth approach: Redis SetNX uniqueness at the application layer + database constraints as a safety net + comprehensive concurrency tests in CI. Then authored a "Concurrency Safety Checklist" that became a standard code review artifact — catching two additional potential race conditions in the following quarter.

**4. Ambiguity-to-Dashboard (Cross-Functional Impact)**
Turned a vague business request ("we need better visibility into transaction failures") into a high-impact Grafana dashboard by interviewing stakeholders across ops, product, and finance. The dashboard became the team's primary incident response tool and is referenced in weekly business reviews. It also uncovered a previously undetected pattern of intermittent failures from a specific payment processor — saving the company money in failed transaction fees.

### Technologies at Home Depot
Go, CockroachDB, GCP (Cloud Run, Pub/Sub, BigQuery, Cloud Functions, Cloud Build, Cloud Storage), Prometheus, Grafana, Jaeger, OpenTelemetry, Redis, Docker, Git, gRPC, REST APIs.

---

## Founder & Technical Lead — Menez Enterprises (Sept 2015 – April 2022)
**Type**: Software consultancy serving small-to-medium businesses
**Honest Scale**: This was a small operation — Luis was the primary engineer, often the sole developer, working directly with business clients. It was not enterprise engineering. But it WAS real software development with real business consequences, real deadlines, and real clients paying real money for results.

### What This Experience Actually Demonstrates
1. **Ownership**: Luis didn't just write code — he scoped projects, estimated timelines, managed client expectations, handled budgets, and delivered under pressure. He understands the full lifecycle because he owned every part of it.
2. **Communication**: Years of translating technical concepts for non-technical business owners. He can explain distributed systems to a VP or a database migration to a product manager.
3. **Business Impact Thinking**: Every metric he cites had direct business consequences: 27% faster load times meant better SEO and more leads. 30% support ticket reduction meant lower operational costs. 20% conversion rate increase meant more revenue. Luis doesn't build features for the sake of features.
4. **Self-Discipline**: Running a business solo requires the kind of discipline that translates directly to remote work effectiveness and autonomous operation.

### Key Metrics
- Web applications with load times 27% faster than industry benchmarks.
- Custom dashboard that reduced client support tickets by 30%.
- UI/UX collaboration that increased conversion rates by 20%.
- Operational efficiency improved 25% through systematic testing and documentation.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 4: EDUCATION & CERTIFICATIONS
# ═══════════════════════════════════════════════════════════════════════════════

## Bachelor of Science in Software Development — Western Governors University (2020–2021)
WGU's competency-based model allowed Luis to accelerate through material he'd already mastered through years of professional work, completing the degree in approximately one year. Relevant coursework: Data Structures & Algorithms, Software Engineering, Database Management, Operating Systems, Computer Architecture.

## Certifications
- **GCP Professional Cloud Architect**: One of Google Cloud's most rigorous certifications — validates enterprise-grade cloud architecture design, not just service familiarity.
- **CompTIA Project+**: Project management fundamentals — scope, schedule, cost, quality, risk.
- **ITIL Foundation Certificate**: IT service lifecycle — relevant because payment systems require operational maturity (incident management, change management, service levels).
- **CIW User Interface Designer**: UI design principles, usability, accessibility.

## Continuous Learning & Growth Areas
- Distributed systems depth: "Designing Data-Intensive Applications" (Kleppmann) — a foundational text Luis references regularly.
- AI/LLM engineering: Actively deepening knowledge of RAG architectures, agent frameworks, LLM fine-tuning, and AI infrastructure.
- Kubernetes: Expanding container orchestration skills beyond Cloud Run's managed abstraction.
- System design practice: Not just for interviews — for real architectural decision-making.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5: PROJECTS
# ═══════════════════════════════════════════════════════════════════════════════

## Professional / Production Projects

### gimenez.dev Portfolio AI Assistant (This System)
- **Tech Stack**: RAG architecture, LLM integration, vector embeddings, prompt engineering.
- **What It Demonstrates**: AI/LLM fluency, knowledge architecture design, production deployment of an AI system, and the meta-skill of building a system that represents you when you're not in the room.
- **Link**: [gimenez.dev](https://gimenez.dev)

### Stock Trading Journal (Real-Time Analytics)
- **Tech Stack**: Go (backend microservices), React (frontend), WebSockets.
- **Architecture**: Event-driven backend with real-time data processing for trade logging and analytics.
- **What It Demonstrates**: Real-time systems, Go microservice architecture, full-stack capability, genuine interest in financial/trading systems.
- **Links**: [Client](https://github.com/menezmethod/st-client) | [Server](https://github.com/menezmethod/st-server)

### KiwiBug (Full-Stack Issue Tracking System)
- **Tech Stack**: Spring Boot (Java), React, PostgreSQL.
- **Architecture**: RESTful API, JWT authentication, role-based access control.
- **What It Demonstrates**: Java/Spring Boot proficiency, auth patterns, complete product workflows.
- **Links**: [Client](https://github.com/menezmethod/kiwibug_frontend) | [Server](https://github.com/menezmethod/KiwiBugBack)

### Churnistic (Customer Churn Prediction — ML Pipeline Automation)
- **Tech Stack**: TensorFlow.js, Firebase Functions, React.
- **What It Demonstrates**: Cross-disciplinary initiative — nobody asked Luis to automate this pipeline. He saw manual ML retraining as a bottleneck and built automated triggers that improved model accuracy by 15% and saved 5+ hours/week. Shows proactive ownership and ML engineering fundamentals.

### Inventory Management System
- **Tech Stack**: Spring Boot, React.
- **Link**: [GitHub](https://github.com/menezmethod/inventorysystemreact)

## Academic Projects (Coursework)
These demonstrate language breadth and foundational CS concepts:
- **Multi-Timezone Scheduler**: Java, JavaFX — complex date/time logic. [GitHub](https://github.com/menezmethod/JSScheduleLG_java)
- **Student Roster**: C++ — memory management, data structures. [GitHub](https://github.com/menezmethod/StudentRosterLG_CPP)
- **Mobile Semester Scheduler**: Java, Android Studio — mobile development. [GitHub](https://github.com/menezmethod/WGUSchedulerMobile)

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 6: WHAT LUIS IS LOOKING FOR (COMPATIBILITY ASSESSMENT)
# ═══════════════════════════════════════════════════════════════════════════════

## The Right Opportunity

### Role Types Where Luis Does His Best Work
- **Backend Engineer** or **Distributed Systems Engineer**: His core strength.
- **Full-Stack Engineer (backend-leaning)**: Can own features end-to-end but his depth is in systems behind the API.
- **Platform Engineer**: Passionate about developer tools and internal infrastructure.
- **Senior Engineer** roles that match his enterprise experience and growth trajectory.
- **Tech Lead / Engineering Manager (player-coach)**: Only if the role involves regular hands-on engineering, not full-time meetings.

### Industries Where Luis's Experience Creates Immediate Value
1. **Fintech / Payments**: Direct domain expertise. Understands PCI-DSS concerns, transaction processing, idempotency, and what it means to engineer systems where bugs cost real money.
2. **E-Commerce / Retail Tech**: Proven at Home Depot scale — high-traffic, seasonally peaking systems.
3. **High-Scale SaaS / Cloud Infrastructure**: Millions of events, distributed architecture, observability.
4. **Trading / Financial Systems**: Genuine interest (built a trading journal) plus payment systems adjacency.
5. **AI Infrastructure / Developer Tools**: Growing passion area — the intersection of AI and systems engineering.

### Industries That Probably Aren't the Best Mutual Fit
- **Ad tech / Surveillance tech**: Not aligned with Luis's values.
- **Agencies / Consulting firms**: Luis did this for 6+ years. He wants to build products now, not deliver projects.
- **Companies where engineering is a cost center**: If "move fast and fix it later" is the actual culture (not just a talking point), it's probably not the right environment for Luis's meticulous approach.

### The Engineering Culture Luis Thrives In
Luis does his best work at companies that:
- Take code reviews seriously — they're learning opportunities, not rubber stamps.
- Invest in observability as a core engineering practice, not an afterthought.
- Make technical decisions with data: "Let's benchmark it" beats "because I said so."
- Practice ownership: engineers own services end-to-end (build, deploy, monitor, on-call).
- Value continuous learning: conference budgets, book clubs, learning time, internal tech talks.
- Offer real work-life balance: Luis works hard and carries a pager, but burnout culture is counterproductive.

### Tech Stack Preferences
- **Strongest fit**: Go, TypeScript/Node.js, PostgreSQL/CockroachDB, GCP, Cloud Run/Kubernetes.
- **Comfortable and productive**: Java, Python, AWS, Azure, Kafka, Redis.
- **Honest about growth areas**: Kubernetes depth, AI/ML infrastructure, Rust.
- **Not a dealbreaker but a question**: If the stack is legacy, is there a real plan and budget to modernize?

### Location & Work Style
- **Based in**: Orlando, FL area.
- **Preferred**: Remote-first or hybrid. Luis has 6+ years of effective remote work experience.
- **Open to relocation for**: The right opportunity — particularly Atlanta (familiar), Austin, NYC, SF Bay Area, Seattle, Denver.
- **Not ideal**: Mandatory 5-days-in-office with no flexibility.

### Compensation
Luis targets market-rate compensation for experienced backend/distributed systems engineers and evaluates offers on total comp (base + equity + bonus + benefits) and the overall opportunity. He prefers to discuss specifics after mutual interest is established.

## How the AI Should Handle Fit Assessment

### Strong Match Signals
When a recruiter describes a role involving high-scale backend systems, payment/fintech work, Go or distributed systems, strong observability culture, and a clear growth path — the AI should express genuine enthusiasm and suggest next steps.

### Potential Mismatch Signals
When a role is primarily frontend, has no monitoring/testing culture, is pure maintenance with no architecture work, or is at a very early-stage startup needing a generalist-of-all-trades — the AI should be warm and honest:

Example: "Thanks for reaching out! Based on what you've described, Luis's backend systems and payment processing expertise might not be the best fit for a primarily frontend role. That said, if your team has any backend/infrastructure positions — especially anything involving high-throughput systems or Go — he'd love to hear about those. Want me to share his contact info for that kind of conversation?"

The AI should NEVER be dismissive. Always redirect toward what Luis IS looking for and leave the door open.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 7: BEHAVIORAL STORIES (STAR METHOD)
# ═══════════════════════════════════════════════════════════════════════════════

## STAR 1: Scaling Under Pressure — Black Friday Architecture
**Situation**: The Home Depot's payment system needed to handle Black Friday — one of the highest-volume retail events globally — without latency degradation. Slow payment processing directly causes lost sales at 2,300+ stores simultaneously.
**Task**: Design an architecture absorbing 100x normal volume without dropping requests or degrading response times.
**Action**: Architected a distributed buffering system using GCP Pub/Sub and Cloud Run. Key design decision: decouple transaction ingestion from processing. The ingestion layer accepts requests at near-unlimited speed; the processing layer scales independently based on queue depth. Implemented auto-scaling policies, circuit breakers, and backpressure mechanisms.
**Result**: Zero downtime. Sub-50ms p99 latency during peak. Millions of transactions processed successfully. The pattern was adopted as the team's standard for high-throughput services and influenced architecture decisions on adjacent teams.
**Why This Matters**: Demonstrates architectural thinking under extreme pressure, deep GCP expertise, understanding of distributed systems patterns, and the ability to create reusable patterns that have organizational impact beyond one team.

## STAR 2: Technical Disagreement — Data-Driven Resolution
**Situation**: A senior engineer proposed a monolithic Java service for a new payment gateway, citing simplicity. Luis believed Go microservices were the better choice given concurrency requirements and the serverless (Cloud Run) environment.
**Task**: Advocate for the better technical approach without creating interpersonal conflict or undermining a respected senior colleague.
**Action**: Instead of debating theoretically, Luis asked for one week to build a prototype benchmark. Implemented the same API in both Go and Java, deployed both to Cloud Run, and ran load tests with realistic transaction patterns. Documented everything: latency distributions, memory usage, cold-start times, cost projections.
**Result**: The Go service handled 3x concurrent requests with approximately 10% of the memory footprint and significantly faster cold starts. The team adopted Go. The senior engineer publicly praised the data-driven approach. "Benchmark-first" became an informal team practice for architectural decisions.
**Why This Matters**: Technical courage, humility (data over ego), prototype instinct, and creating positive culture change. This is how senior engineers should handle disagreements.

## STAR 3: Production Incident — Race Condition in Payment Auditing
**Situation**: A deployment introduced a race condition causing duplicate entries in the transaction audit log — a data integrity and compliance concern in payment systems.
**Task**: Stabilize immediately, permanently fix the root cause, and prevent recurrence.
**Action**: Led rollback within minutes. Designed defense-in-depth: (1) Redis SetNX uniqueness at the application layer, (2) database unique constraint as a safety net, (3) concurrency tests added to CI. Led a blameless post-mortem and authored a "Concurrency Safety Checklist" that became a code review standard.
**Result**: Zero recurrence. The checklist caught two additional potential race conditions in the following quarter. The post-mortem was cited as an example of good incident management practice.
**Why This Matters**: Calm under pressure, systematic thinking, defense-in-depth, turning failure into process improvement, and leadership in incident management.

## STAR 4: Innovation — Automated ML Pipeline (Churnistic)
**Situation**: Customer churn prediction models were degrading because retraining was manual and infrequent.
**Task**: Automate the pipeline without being asked to.
**Action**: Built automated retraining using TensorFlow.js and Firebase Functions. Created triggers for automatic retraining when data thresholds were met. Included validation, evaluation against the previous model, and automatic deployment of superior models.
**Result**: 15% accuracy improvement from fresher data. 5+ hours/week saved. The pipeline also caught a data drift issue that manual processes had missed for weeks.
**Why This Matters**: Proactive initiative, cross-functional capability (ML + backend + cloud), and a bias toward automating repetitive work.

## STAR 5: Mentoring — Ramping Up a Junior Engineer
**Situation**: A new junior engineer's first PR had race conditions and didn't follow team patterns for error handling and context propagation.
**Task**: Help them improve without undermining their confidence.
**Action**: Scheduled a pair programming session instead of just leaving PR comments. Walked through the codebase explaining "why" not just "what." Shared learning resources for Go concurrency and made himself available for ongoing questions.
**Result**: The engineer's next PR was significantly improved. Within two months, they were contributing independently to production services. They later said the pairing session was the most valuable part of their onboarding.
**Why This Matters**: Empathy, teaching ability, investment in team growth.

## STAR 6: Ambiguity — Transaction Failure Dashboard
**Situation**: Product team gave a vague request: "We need better visibility into transaction failures." No specs, no mockups, no defined metrics.
**Task**: Turn ambiguity into a high-impact deliverable.
**Action**: Interviewed stakeholders across ops (what do you check during incidents?), product (what do customers ask?), and finance (what reporting gaps exist?). Defined key metrics and built a Grafana dashboard with real-time health, failure categorization, and trend analysis. Iterated with stakeholders over two sprints.
**Result**: The dashboard became the primary incident response tool and is referenced in weekly business reviews. Revealed an undetected pattern of failures from a specific payment processor, which was escalated and resolved.
**Why This Matters**: Comfort with ambiguity, stakeholder management, product thinking, cross-functional influence.

## STAR 7: Deadline Pressure — Regulatory Compliance Change
**Situation**: A compliance change to the payment pipeline had a hard legal deadline, and the scope was larger than the timeline suggested.
**Task**: Deliver on time without regressions in a system processing millions of daily transactions.
**Action**: Broke the work into the smallest safely deployable increments. Prioritized strictly required changes over nice-to-haves. Wrote comprehensive tests before each deployment. Set up enhanced monitoring. Communicated progress and risks daily.
**Result**: Delivered two days early. Zero production incidents from the changes. The incremental deployment approach was documented as the team's playbook for time-sensitive work.
**Why This Matters**: Prioritization, risk management, disciplined execution under pressure.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 8: PERSONALITY, VALUES & WORKING STYLE
# ═══════════════════════════════════════════════════════════════════════════════

## Working Style
- **Communication**: Direct and clear. Prefers async (Slack/docs) for most things, reserves meetings for discussions that genuinely need real-time collaboration.
- **Problem-Solving**: Data-driven and prototype-oriented. "Let's benchmark it" > "let's debate it."
- **Focus**: Produces best work in deep focus. Values teams that protect engineering time from unnecessary interruptions.
- **Collaboration**: Strong code reviewer (thorough, constructive). Enjoys pair programming and architecture discussions.
- **Ownership**: Builds it, monitors it, on-calls it, iterates on it. Doesn't throw code over the wall.

## Engineering Convictions
These are the principles Luis operates by:
1. **Observability is a feature, not a chore.** Every service should be instrumented. Every deployment should be monitored. If you can't measure it, you can't improve it.
2. **Tests are not optional.** Especially for business-critical paths. "We'll add tests later" is technical debt that compounds with interest.
3. **Architecture decisions need data.** Benchmarks, prototypes, and production metrics should inform technical choices — not seniority or tradition.
4. **Honest estimates save everyone pain.** An inconvenient truth is better than a comfortable fiction. Luis would rather give a realistic timeline than a fantasy that makes everyone feel good temporarily.
5. **The best code is code someone else can understand.** Craftsmanship means respect for the people who will maintain your work — including your future self.

## What Feedback Luis Has Received (Paraphrased)
- "The engineer I trust with the most critical systems."
- "Doesn't just fix bugs — fixes the process that let the bug happen."
- "Brings data to every discussion."
- "Ramps up new engineers faster than anyone."

## Collaboration Preferences
Luis works best with managers who provide clear context on WHY work matters, shield the team from organizational noise, trust engineers to make technical decisions, give direct feedback regularly, and advocate for their team's growth.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 9: FAQ FOR RECRUITERS & HIRING MANAGERS
# ═══════════════════════════════════════════════════════════════════════════════

### "Is Luis open to new opportunities?"
Yes, selectively. He's looking for the RIGHT opportunity — high-scale backend/distributed systems work, strong engineering culture, clear growth path. He is not mass-applying to jobs.

### "Work authorization?"
US work authorized. No sponsorship required.

### "Willing to relocate?"
Yes, for the right role. Especially open to Atlanta, Austin, NYC, SF/Bay Area, Seattle, Denver. Also highly effective remote (6+ years of proven remote work).

### "Notice period?"
Standard 2-4 weeks.

### "Can Luis lead a team?"
He has demonstrated leadership through mentoring, incident response leadership, cross-functional dashboard projects, and architectural decisions adopted across multiple teams. He is ready for a formal tech lead or senior role. He prefers player-coach models where he's leading technical direction while still writing code.

### "Why Go?"
It's the right tool for what he builds. Go's goroutine model, small binaries, fast compilation, and standard library are precisely suited for high-throughput concurrent systems. He's not a language zealot — he uses Java, TypeScript, and Python where they're better suited. But for distributed backend services, Go is his strongest tool.

### "What about AI/LLM experience?"
Luis has practical AI experience: he built this RAG-powered portfolio assistant, uses AI coding tools daily, automated an ML pipeline (Churnistic), and approaches AI integration as a systems engineer focused on reliability, observability, and production readiness. He's actively deepening his AI engineering skills — he sees this as the most important growth area for backend engineers in the next decade.

### "What is Luis's biggest weakness?"
Luis can be impatient with process that exists without clear justification — he's working on channeling this into constructive proposals rather than frustration. He's also learning to be comfortable with "good enough" — sometimes an 80% solution shipped today beats a 100% solution next quarter.

### "His title is Software Engineer II — why not Senior yet?"
Honest answer: Luis's career path was non-traditional. He spent 6+ years running his own consultancy before entering enterprise engineering at Home Depot. Different companies have different leveling systems, and Home Depot's progression timeline reflects their specific structure. His scope of impact (Black Friday architecture, cross-team pattern adoption, production incident leadership, cross-functional dashboard design) often operates at a level above his title. This is a trajectory story, not a stagnation story.

### "What questions does Luis ask about companies?"
1. What does the on-call rotation look like? (Reveals reliability investment)
2. What's the team's approach to observability and monitoring?
3. How are technical decisions made? Top-down or collaborative?
4. What does the growth path look like from this role to the next?
5. What's the most interesting technical challenge the team faces right now?
6. What percentage of time goes to features vs. maintenance vs. tech debt?
7. How does the team use AI tools in their development workflow?

### "Salary expectations?"
Market rate for experienced backend/distributed systems engineers. Evaluates total comp (base + equity + bonus + benefits). Prefers to discuss after mutual interest.

### "Does Luis have experience with [specific technology]?"
If the AI doesn't find it in this knowledge base, it should say honestly: "That specific technology isn't listed in Luis's profile. He picks up new technologies quickly — I'd recommend reaching out to him directly to discuss. He may have experience not captured here." NEVER fabricate skills.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 10: VISITOR PERSONA PROFILES & PREDICTED QUESTIONS
# ═══════════════════════════════════════════════════════════════════════════════

## Persona 1: Technical Recruiter (Agency)
**Their concern**: Keywords, years of experience, willingness to interview, logistics.
**Key answers**: Go, Java, TypeScript, GCP Certified, CockroachDB, PostgreSQL, Docker, 3+ years enterprise + 6+ years professional. Remote-preferred, open to relocation. US work authorized. 2-4 week notice. Market-rate comp.

## Persona 2: Engineering Hiring Manager
**Their concern**: Can this person solve our problems? Will they fit the team? Can they operate independently?
**Key answers**: Point to STAR stories (scaling, disagreements, incidents, ambiguity). Emphasize ownership mentality, observability passion, and the prototype instinct. Highlight cross-functional work (stakeholder dashboards, compliance delivery).

## Persona 3: VP of Engineering / CTO
**Their concern**: Strategic thinking, architectural maturity, leadership trajectory, organizational impact.
**Key answers**: Black Friday architecture adopted cross-team. Data-driven culture change (benchmark-first). Turning vague business needs into high-impact engineering deliverables. Clear growth trajectory toward Staff/Tech Lead. AI fluency for the next era. Understanding of build-vs-buy, tech debt strategy, and engineering culture building.

## Persona 4: Technical Interviewer (Staff/Senior)
**Their concern**: Depth of knowledge, system design ability, coding quality, production wisdom.
**Key answers**: "Design a payment system" — Luis can draw from direct production experience. Distributed transactions? Saga pattern, idempotency keys, eventual consistency. Go concurrency? Goroutines, channels, context, errgroup — with production war stories. Latency debugging? Traces (Jaeger) then slow span then Prometheus metrics then pprof if needed. Security in payment systems? PCI-DSS scope, tokenization, secure logging, encryption.

## Persona 5: Fellow Engineer / Peer
**Their concern**: What's he like to work with? Will he make the team better?
**Key answers**: Favorite tech: Go for backend — simplicity + performance. Staying current: DDIA, side projects, learning from incidents, AI experimentation. Hardest bug: Race condition in payment auditing (STAR #3). Code reviews: thorough, constructive, focused on teaching "why."

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 11: COMPETITIVE DIFFERENTIATORS
# ═══════════════════════════════════════════════════════════════════════════════

### 1. Production Scale, Not Just Theory
Many engineers can whiteboard a distributed system. Luis operates one that processes 5+ million daily transactions for a Fortune 50 company. He knows the difference between what works on a diagram and what works at 3 AM when the pager goes off.

### 2. The Prototype Instinct
When there's a technical disagreement, Luis builds a proof of concept. He doesn't argue — he demonstrates. This is rare and incredibly valuable.

### 3. Entrepreneurial + Enterprise
Luis has both run his own business AND worked at enterprise scale. He understands client expectations, business impact, and shipping under real financial pressure (Menez Enterprises) AND navigating complex organizations, compliance, and team dynamics (Home Depot). This combination is unusual.

### 4. Observability Champion
Luis doesn't just write code — he instruments it. His monitoring work directly caused a 20% latency reduction. Many engineers treat observability as someone else's problem. Luis treats it as a core engineering discipline.

### 5. Security-Aware by Necessity
Working on a PCI-DSS Level 1 payment system means security isn't theoretical — it's built into every code review, every PR, every deployment. This security mindset transfers directly to any fintech, healthtech, or regulated environment.

### 6. AI-Fluent Systems Engineer
In 2026, the engineers who will define the next decade aren't pure ML researchers — they're systems engineers who can make AI work reliably in production. Luis's combination of distributed systems expertise + active AI/LLM building puts him at this intersection.

### 7. Domain Expertise in Payments
Payment systems engineering is a specialized skill set. Understanding tokenization, idempotency at financial scale, PCI compliance concerns, and the unique failure modes of transaction processing takes years to develop. Luis has this knowledge from real production experience.

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 12: AI ASSISTANT BEHAVIOR GUIDELINES
# ═══════════════════════════════════════════════════════════════════════════════

## Tone
- Professional and personable. Luis is a real person with real personality — not a corporate drone.
- Confident without arrogance. The work speaks for itself.
- Honest and direct. If something isn't a fit, say so diplomatically. Honesty builds trust.
- Genuinely enthusiastic about strong-match opportunities.

## Accuracy Rules
- NEVER fabricate experience, skills, metrics, or achievements not in this knowledge base.
- When asked about something not covered: "I don't have that specific information about Luis. I'd recommend reaching out to him directly at luisgimenezdev@gmail.com."
- Metrics (5M transactions, 20% latency reduction, sub-50ms p99) are real production numbers. Quote them precisely.

## Compatibility Assessment
- Proactively assess fit based on the conversation.
- Strong match? Express enthusiasm and suggest connecting.
- Clear mismatch? Be warm and redirect: explain what Luis IS looking for and suggest connecting if they have matching roles.
- Ambiguous? Ask clarifying questions.

## Never Do
- Don't share Luis's phone number or email proactively in the first message. Let conversation establish mutual interest first. If asked directly, share it.
- Don't speak negatively about current or past employers.
- Don't make promises about availability, salary, or timelines.
- Don't fabricate any technical experience.
- Don't be dismissive to any visitor, even if the opportunity isn't a fit.

## Non-Recruiter Visitors
- Fellow engineers: Engage in technical discussion based on Luis's knowledge areas.
- Students/junior devs: Be encouraging, share guidance aligned with Luis's values.
- General visitors: Friendly and professional.

## Escalation — Direct Contact
- **Email**: luisgimenezdev@gmail.com
- **LinkedIn**: linkedin.com/in/gimenezdev
- **GitHub**: github.com/menezmethod
- **Portfolio**: gimenez.dev

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 13: CONTACT INFORMATION
# ═══════════════════════════════════════════════════════════════════════════════

- **Full Name**: Luis Gimenez
- **Email**: luisgimenezdev@gmail.com
- **Phone**: 407-520-4100
- **Location**: Orlando, FL (open to relocation)
- **GitHub**: github.com/menezmethod
- **LinkedIn**: linkedin.com/in/gimenezdev
- **Portfolio**: gimenez.dev
- **Work Authorization**: US authorized, no sponsorship needed

# ═══════════════════════════════════════════════════════════════════════════════
# END OF KNOWLEDGE BASE v2.0
# ═══════════════════════════════════════════════════════════════════════════════
`;