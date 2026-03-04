# Documentation

Additional project documentation. For quick start and main reference, see the root [README.md](../README.md) and [AGENTS.md](../AGENTS.md).

| Document | Description |
|----------|-------------|
| [DEPLOY-CLOUDRUN.md](./DEPLOY-CLOUDRUN.md) | Cloud Run deployment checklist (GCP, Terraform, DNS, auto-deploy) |
| [SETUP.md](./SETUP.md) | Step-by-step setup instructions |
| [DEBUGGING_CHAT.md](./DEBUGGING_CHAT.md) | Chat / RAG debugging notes |
| [DECISIONS.md](./DECISIONS.md) | Architecture and product decisions |
| [QUESTIONS.md](./QUESTIONS.md) | Open questions and follow-ups |
| [PLAN-CHAT-LOGGING.md](./PLAN-CHAT-LOGGING.md) | Chat session logging (implemented): Firestore, memory, engagement, admin |
| [CHAT-SECRETS.md](./CHAT-SECRETS.md) | GCP Secret Manager: Firebase + admin secret setup for chat |
| [PLAN-V2-ADMIN-BOARD.md](./PLAN-V2-ADMIN-BOARD.md) | **Administration Board (implemented):** single pane of glass — War Room + recruiter activity + logs + Prometheus metrics |
| [CHECKLIST-FINAL-SWEEP.md](./CHECKLIST-FINAL-SWEEP.md) | **Final sweep:** Terraform best practices, $20 budget kill switch, free tier, security, secrets (no keys in repo) |
| [TRAFFIC-AND-COST.md](./TRAFFIC-AND-COST.md) | **Traffic spike readiness:** Rate limits (Cloud Armor + app), caching (CDN + in-memory), cost caps; avoid going poor if the portfolio blows up |
| [GRAFANA-LOKI-HIGHLEVEL.md](./GRAFANA-LOKI-HIGHLEVEL.md) | **Grafana + Loki (high-level):** Options for logs; Grafana Cloud free tier vs self-host; Cloud Logging → Loki via Alloy + Pub/Sub |
| [CI-AND-TESTS.md](./CI-AND-TESTS.md) | **CI and tests:** Lint, build, Vitest, Cypress; GitHub Actions; require CI before merging (`gh` or UI) |
| [PRODUCTION-V1-READINESS.md](./PRODUCTION-V1-READINESS.md) | **Production v1 readiness:** Design, daily budget, tests, CI, branch protection checklist |

## Architecture Decision Records

| ADR | Decision |
|-----|----------|
| [ADR-001](./adr/001-single-cloud-run-instance.md) | Single Cloud Run instance with $20 budget kill switch |
| [ADR-002](./adr/002-page-visibility-war-room-polling.md) | Page Visibility API for War Room polling |
| [ADR-003](./adr/003-chat-node-runtime-not-edge.md) | AI chat uses Node.js runtime, not Edge |
