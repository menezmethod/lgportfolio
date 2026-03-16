# Edge Control Plane (n8n)

This document defines the first production-grade automation workflows for the portfolio operating environment.

- **Control plane:** `n8n.menezmethod.com` on a Raspberry Pi 5 with 24/7 uptime
- **Application plane:** `gimenez.dev` on GCP Cloud Run
- **Inference plane:** `llm.menezmethod.com` for self-hosted LLM calls

The goal is not to build a vague AI assistant. The goal is to build a **policy-driven operator system** that detects problems, explains them, and takes bounded mitigation steps without improvising against production.

**Current status**

- `Site Sentinel`, `DNS / SSL Guardian`, `Deploy Guardian`, and `Cost Governor` are active on the Pi 5 control plane
- workflow assets are versioned in-repo and re-importable onto the Pi
- Slack channels for ops and approvals are wired into the workflow definitions
- `Inference Router` is versioned and kept inactive until we expose a production-safe trigger
- the two remaining platform gaps are:
  - public webhook registration for `deploy-guardian` and `cost-governor`
  - SQLite lock contention when using `n8n execute --id=...` against the live instance

**Implementation note**

- The Pi runtime supports `$env` in expressions and Code nodes, but not `process.env`.
- External API calls are implemented with **HTTP Request nodes**, not Code-node `fetch`, to stay aligned with n8n’s supported execution model.
- Safe drill mode is available through `CONTROL_PLANE_DRILL=1` so monitors can emit alerts without creating a real outage.

---

## Architecture stance

This design follows a few principles taken from *The Architect's Playbook*:

- **Application-layer intercepts, not prompts.**
  Safety and control live in workflow logic, schemas, approvals, and policy tables.
- **Route by SLA.**
  Fast mitigation paths stay deterministic. AI runs in asynchronous triage and summaries.
- **Validate every structured output.**
  If a model returns malformed JSON or low-confidence analysis, retry with error feedback or send it to human review.
- **Split broad tools into narrow tools.**
  Avoid one giant "run shell" capability when a workflow only needs `check_dns`, `check_ssl`, or `set_cloud_run_max_instances`.
- **Maintain structured state.**
  Persist incidents, decisions, and prior mitigations outside model context.
- **Parallelize independent checks.**
  DNS, SSL, deploy health, Cloud Run status, budget state, and log summaries can run in parallel and then merge into one decision.

That gives us a clean story:

```text
Pi 5 / n8n  ->  detects, classifies, approves, audits
GCP         ->  hosts the site and enforces guardrails
LLMs        ->  summarize, classify, recommend
Humans      ->  approve destructive actions
```

---

## Tool choices

### Coordinator

- **n8n on Pi 5**
  - Best fit for workflow orchestration, approvals, timers, webhooks, and integration glue
  - Independent failure domain from GCP
  - Stronger architecture story than hosting everything in the same cloud

### Enforcement layer

- **GCP native controls**
  - Cloud Monitoring uptime checks
  - Cloud Run service configuration
  - Billing alerts / budget notifications
  - Cloud Logging and Cloud Trace

### State

- **Recommended:** PostgreSQL for incidents, decision logs, workflow state, and approval records
- **Optional later:** Redis if queue mode or higher concurrency becomes necessary

### Models

- **Primary analysis:** `llm.menezmethod.com`
  - private reasoning
  - architecture explanations
  - bounded incident classification
- **Cheap overflow / summaries:** NVIDIA API
  - incident summaries
  - daily or weekly ops briefs
  - low-cost secondary classifier

### Access and approval

- Slack, Telegram, or email for approvals
- Tailscale or equivalent private admin access to the Pi
- Audit every action taken by an agent

---

## Workflow inventory

Start with four workflows and one reporting workflow.

### 1. Site Sentinel

**Purpose**

Detect whether the public site is healthy and capture enough evidence to classify failures quickly.

**Versioned asset**

- Import file: `ops/n8n/workflows/site-sentinel.json`

**Trigger**

- Schedule every 5 minutes
- Optional manual trigger webhook for testing

**Checks**

- `GET https://gimenez.dev/`
- `GET https://gimenez.dev/api/health`
- `GET https://gimenez.dev/war-room`
- `GET https://gimenez.dev/api/war-room/data`
- Cloud Run service status
- latest deploy status from GitHub
- managed SSL status

**Parallel branches**

- HTTP availability branch
- SSL / certificate branch
- Cloud Run state branch
- GitHub deploy branch

**Decision logic**

- If all checks pass: write heartbeat event
- If one check fails once: write degraded event and recheck in 60 seconds
- If repeated failures: open incident record and trigger incident triage

**Allowed actions**

- create incident record
- notify operator
- trigger `Incident Triage`

**Not allowed**

- mutate production directly

---

### 2. DNS / SSL Guardian

**Purpose**

Catch the exact class of failure that took the site down: DNS drift, stale A records, SSL stuck provisioning, `FAILED_NOT_VISIBLE`, or missing hostname coverage.

**Trigger**

- Schedule every 30 minutes
- Immediate trigger from Site Sentinel when HTTPS fails but HTTP still redirects

**Inputs**

- authoritative DNS lookup
- multiple public resolver lookups
- managed certificate status
- HTTPS probe on apex and `www`

**Decision logic**

- DNS mismatch: raise `dns_drift`
- cert `PROVISIONING` + DNS healthy: raise `ssl_waiting`
- cert `FAILED_NOT_VISIBLE`: raise `ssl_visibility_failure`
- `www` missing coverage: raise `hostname_coverage_gap`

**Allowed actions**

- send exact remediation message
- create GitHub issue
- post incident summary

**Not allowed**

- rewrite registrar DNS automatically

That keeps the workflow useful and safe.

---

### 3. Deploy Guardian

**Purpose**

Watch merges and deploys, run smoke checks, and prevent a bad release from sitting broken.

**Trigger**

- GitHub Actions webhook
- Cloud Build webhook if available

**Inputs**

- branch / commit SHA
- deployment target
- Cloud Run revision
- smoke checks on `/`, `/about`, `/work`, `/chat`, `/war-room`, `/api/health`

**Decision logic**

- Deploy succeeded + smoke checks pass: mark healthy deploy
- Deploy succeeded + smoke checks fail: open incident and recommend rollback
- Deploy failed: open incident and attach logs

**Allowed actions**

- notify operator
- create issue / incident
- call rollback workflow only after approval

**Optional later**

- automatic rollback when:
  - bad deploy signature is high confidence
  - previous revision is known healthy
  - action is explicitly enabled by policy

**Implementation note**

- `ops/n8n/workflows/deploy-guardian.json` combines a manual start and `deploy-guardian` webhook, runs the smoke checks documented above, emits a structured summary, and throws when two consecutive smoke-check runs fail to trigger an escalation path.

---

### 4. Cost Governor

**Purpose**

Control runaway spend without destroying the public presence unless a last resort is required.

**Trigger**

- Schedule every 10-15 minutes
- GCP billing notification / webhook if configured

**Inputs**

- month-to-date spend
- forecast spend
- Cloud Run request volume
- 429 / 5xx counts
- chat request volume
- Artifact Registry storage growth
- current Cloud Run max instances

**Mitigation ladder**

1. warn only
2. tighten expensive feature limits
3. disable chat
4. reduce Cloud Run max instances
5. set max instances to `0` as emergency kill

**Key rule**

Never disable the public site domain path as a first-line cost action. Preserve public presence whenever possible.

**Allowed actions**

- adjust feature flags
- hit a safe internal endpoint to disable chat
- call `gcloud run services update ... --max-instances`

**Approval boundary**

- chat disable: optional auto
- max instances to `0`: approval recommended unless budget breach policy explicitly allows autonomous shutdown

---

### 5. Incident Triage

**Purpose**

Take raw signals from other workflows and turn them into a precise operator report.

**Trigger**

- Called by Site Sentinel, Deploy Guardian, or DNS / SSL Guardian

**Inputs**

- incident type
- latest health results
- recent logs
- current deploy SHA
- DNS status
- SSL status
- budget state

**Pattern**

- deterministic data collection first
- LLM summary second
- typed output required

**Typed output shape**

```json
{
  "incident_type": "deploy_failure | ssl_visibility_failure | dns_drift | budget_risk | app_degraded",
  "severity": "low | medium | high | critical",
  "likely_cause": "string",
  "evidence": ["string"],
  "recommended_actions": ["string"],
  "confidence": 0.0
}
```

If validation fails, retry once with the validation error appended. If confidence remains low, route to human review.

---

### 6. Weekly Ops Brief

**Purpose**

Produce a VP-readable summary of operational maturity.

**Trigger**

- Weekly schedule

**Contents**

- uptime summary
- deploy count
- incidents detected
- mitigations taken
- cost trend
- top recurring issues
- recommended next improvements

This is one of the best recruiter and executive artifacts because it shows the system is measured, not theatrical.

---

## Policy table

Use explicit policy nodes or a small policy datastore.

| Condition | Workflow action |
|---|---|
| site healthy, no anomaly | write heartbeat only |
| one failed health check | recheck in 60 seconds |
| repeated health failures | create incident and notify |
| cert provisioning and DNS correct | notify, monitor, no mutation |
| cert failed not visible | notify with exact DNS / SSL evidence |
| deploy success but smoke fails | create incident, recommend rollback |
| spend trend rising but site healthy | warn or tighten chat limits |
| budget threshold breached | disable chat or reduce instances |
| critical spend event | require approval or emergency kill depending on policy |

---

## Narrow tool set

Avoid broad shell access in agent-facing steps.

Recommended tools:

- `check_site_health`
- `check_war_room`
- `check_ssl_status`
- `check_dns_authoritative`
- `check_dns_public`
- `check_github_deploy`
- `check_cloud_run_service`
- `check_budget_state`
- `disable_chat_feature`
- `set_cloud_run_max_instances`
- `create_incident_record`
- `send_approval_request`
- `post_ops_summary`

Each tool should have:

- clear input schema
- clear output schema
- single responsibility
- explicit failure mode

---

## Human approval design

Require approval for:

- rollback
- changing Cloud Run instance caps downward in a disruptive way
- emergency shutdown
- any DNS mutation

Do not require approval for:

- heartbeat logging
- status checks
- incident creation
- report generation
- chat summaries

This keeps the workflows precise instead of turning them into a generic, over-trusting agent.

---

## Testing strategy

Do not call a workflow "done" until it passes drills.

### Drill 1: homepage synthetic outage

- temporarily point Site Sentinel to a non-existent path or block the app path locally
- expected result:
  - failed health recorded
  - retry happens
  - incident created on repeated failure
  - no destructive production action

### Drill 2: bad deploy simulation

- deploy a revision with a broken route or intentionally fail a smoke check in staging
- expected result:
  - Deploy Guardian catches it
  - incident summary includes deploy SHA
  - rollback recommendation is produced

### Drill 3: SSL failure simulation

- use a staging hostname with intentionally broken DNS or incomplete cert coverage
- expected result:
  - DNS / SSL Guardian identifies the failure class correctly
  - apex vs `www` distinction is preserved

### Drill 4: budget pressure simulation

- feed Cost Governor mocked spend inputs above thresholds
- expected result:
  - mitigation ladder runs in the right order
  - destructive action requires approval when policy says so

### Drill 5: malformed LLM output

- force Incident Triage to receive invalid JSON from the model
- expected result:
  - validation catches it
  - retry includes error feedback
  - human review is used if needed

### Drill 6: Pi reboot recovery

- restart the Pi or n8n container
- expected result:
  - workflows recover cleanly
  - credentials and state remain intact
  - no orphaned incidents or duplicated actions

### Drill 7: control-plane drill mode

- run the monitor workflows with `CONTROL_PLANE_DRILL=1`
- expected result:
  - Slack alerts are emitted even when the site is healthy
  - the alert body clearly marks the run as a drill
  - no production mutation occurs

---

## Minimum viable implementation order

1. Site Sentinel
2. DNS / SSL Guardian
3. Deploy Guardian
4. Incident Triage
5. Cost Governor
6. Weekly Ops Brief

This order gives immediate portfolio value while keeping risk low.

---

## Access required for live implementation

To wire this onto the Pi and GCP directly, the minimum access needed is:

- SSH access to the Pi 5 hosting `n8n`
- access to the `n8n` environment or container definitions
- a service account or CLI auth path for:
  - Cloud Run read/update
  - Cloud Monitoring read
  - Cloud Billing alert integration
  - Cloud Logging read
- access to the GitHub repo webhooks or Actions status

Recommended approach:

- start with read-only checks and notifications
- add safe mutations second
- gate disruptive actions behind approval

---

## Why this is VP-impressive

This is not "an AI assistant on a website."

It is an **edge-hosted, out-of-band operator system** that:

- supervises a cloud workload from an independent failure domain
- protects uptime and budget with policy-driven automation
- uses AI only where it adds leverage
- keeps humans in the loop for risky changes
- leaves behind an audit trail and executive-readable ops summaries

That is the right story for Staff and Principal-track systems work.

---

## Skeptical VP review

A skeptical VP is not going to ask whether the agents are clever. They are going to ask whether the system is **safe, durable, measurable, and worth trusting**.

These are the obvious objections and the corresponding fixes.

### Objection 1: "This is still a single hobby box."

**Risk**

- the Pi 5 is a strong edge-control-plane story, but it is still one physical device
- if the Pi is down, the control plane disappears

**Patch**

- add a UPS or battery-backed power path
- add a host-health workflow for the Pi itself
- add off-device backups for the n8n database and workflow exports
- migrate n8n from SQLite to Postgres if you want reliable CLI execution while the instance stays online
- keep the most important kill switches in GCP-native controls so the platform is not fully dependent on n8n

**What to prove**

- Pi reboot recovery drill
- restore workflow export to a second machine or container

### Objection 2: "Your automation plane can take action, but where are the guardrails?"

**Risk**

- impressive automation without approval boundaries looks reckless
- broad shell access turns the system into a security story instead of an architecture story

**Patch**

- keep action tools narrow and schema-validated
- require approval for rollback, shutdown, or disruptive scaling changes
- separate read-only workflows from mutation workflows
- expose only approved workflows through MCP
- keep outbound calls in supported nodes like HTTP Request instead of custom runtime hacks

**What to prove**

- a workflow can recommend rollback without being able to invent one
- destructive actions produce an approval record and audit trail

### Objection 3: "What happens when your local model is down?"

**Risk**

- if the inference layer is single-homed to `llm.menezmethod.com`, the AI story looks brittle

**Patch**

- build an `Inference Router` workflow
- local LLM is primary for private reasoning
- NVIDIA API is secondary for summaries and classification
- deterministic templates are the last fallback when all models are unavailable

**What to prove**

- the incident still gets triaged when the local LLM is unavailable
- fallback routing is visible in the audit record

### Objection 4: "Where is the business value?"

**Risk**

- a reliability demo without cost, deployment, and abuse controls can still look like engineering theater

**Patch**

- prioritize `Deploy Guardian`, `Cost Governor`, and `Abuse Sentinel`
- measure avoided incidents, reduced time-to-diagnosis, and avoided spend
- produce a weekly ops brief that an executive can actually read

**What to prove**

- prevented or shortened bad deploy impact
- kept monthly cost under a target
- detected and contained abnormal traffic or model abuse

### Objection 5: "How do I know this is not just a nice dashboard?"

**Risk**

- if the system only observes, it looks like reporting instead of operations

**Patch**

- every major workflow needs a `sense -> decide -> act -> audit` chain
- at least one workflow must take a safe autonomous action
- the action must be reversible and bounded

**What to prove**

- cost or abuse workflow can safely disable chat without taking down the whole site
- agent actions show the exact policy that fired

### Objection 6: "Your security posture is weaker than your architecture slide."

**Risk**

- MCP is public
- tokens can leak
- the current n8n basic auth password is weak

**Patch**

- rotate n8n basic auth immediately
- rotate MCP tokens after any exposure
- prefer HTTPS-only MCP clients
- keep mutation workflows private or approval-gated
- add token and secret rotation to the operating checklist

**What to prove**

- token rotation does not break workflow operations
- public MCP only exposes the intended workflow surface

---

## Execution roadmap

The next phase is not "more agents." It is a **small reliability and cost-control program** with clear milestones.

### Phase 0: hardening the control plane

**Goal**

Make the current Pi 5 + n8n control plane credible enough to trust for operational demos.

**Work**

- rotate n8n basic auth and MCP token
- document MCP connection requirements and token hygiene
- add `n8n` host-health monitoring
- back up workflow exports and database snapshots off-device
- move n8n storage from SQLite to Postgres so CLI drills and live runtime can coexist cleanly

**Exit criteria**

- compromised token can be rotated in minutes
- workflow exports are recoverable
- control plane health is monitored separately from app health

### Phase 1: detect and explain

**Goal**

Detect failure classes quickly and package the evidence cleanly.

**Work**

- keep `Site Sentinel` as the heartbeat baseline
- build `DNS / SSL Guardian`
- build `Deploy Guardian`
- build `Incident Triage`

**Exit criteria**

- every incident summary includes cause hypothesis, evidence, and next actions
- at least three drills pass: bad deploy, DNS drift, cert failure

### Phase 2: degrade safely

**Goal**

Show bounded autonomy that reduces blast radius without being reckless.

**Work**

- build `Cost Governor`
- build `Abuse Sentinel`
- add a safe `disable_chat` action path
- add approval gates for disruptive actions

**Exit criteria**

- one workflow can take a reversible autonomous action
- emergency shutdown remains approval-gated or explicitly policy-controlled

### Phase 3: resilient AI operations

**Goal**

Prove that AI is infrastructure, not a fragile dependency.

**Work**

- build `Inference Router`
- local LLM primary
- NVIDIA fallback for summaries/classification
- deterministic fallback when both models are unavailable
- write the fallback decision into the incident audit record

**Exit criteria**

- incident triage still completes when the local model is down
- operators can see which model path was used and why

### Phase 4: executive operating system

**Goal**

Turn the system into something leadership can evaluate in one glance.

**Work**

- build `Weekly Ops Brief`
- add metrics for:
  - incidents detected
  - avoided bad deploys
  - mitigations taken
  - avoided spend
  - mean time to diagnosis
- publish a portfolio case study with screenshots, system diagram, and drills

**Exit criteria**

- the control plane produces an executive-readable artifact every week
- the site can demonstrate closed-loop operations, not just workflow count

---

## Recommended build order

If the goal is to impress a skeptical VP quickly, build in this order:

1. `DNS / SSL Guardian`
2. `Deploy Guardian`
3. `Inference Router`
4. `Cost Governor`
5. `Abuse Sentinel`
6. `Incident Triage`
7. `Weekly Ops Brief`

Why this order:

- `DNS / SSL Guardian` proves operational scar tissue
- `Deploy Guardian` proves engineering judgment
- `Inference Router` patches the AI resiliency hole
- `Cost Governor` proves business awareness
- `Abuse Sentinel` proves security awareness
- `Incident Triage` and `Weekly Ops Brief` turn the whole thing into a leadership-ready story

---

## Inference fallback architecture

The AI layer should be treated like any other dependency: it needs routing, degradation, and auditing.

### Routing policy

| Condition | Model path | Notes |
|---|---|---|
| private reasoning needed and local LLM healthy | `llm.menezmethod.com` | primary path |
| local LLM unavailable or above latency threshold | NVIDIA API | fallback path |
| both models unavailable | deterministic template | no hallucinated analysis |

### Good uses for NVIDIA fallback

- incident summaries
- failure classification
- weekly ops brief drafting
- deploy change summaries

### Bad uses for NVIDIA fallback

- direct infrastructure mutation
- freeform tool execution
- authorization decisions
- hot-path request handling for the public site

### Acceptance criteria

- local-model outage does not block incident reporting
- fallback use is visible in logs and incident records
- model outages do not prevent deterministic mitigations

---

## What we should build next

The best next workflow is **`DNS / SSL Guardian`**.

Reasons:

- it matches a real outage you already experienced
- it is mostly deterministic, which keeps risk low
- it creates immediate credibility because it solves a painful and believable failure mode
- it gives us a clean way to demonstrate MCP execution plus structured evidence

After that, move directly to **`Deploy Guardian`** and then **`Inference Router`**.

### Cost Governor Implementation Note

- Added the `Cost Governor` workflow that ingests either the scheduled mock input or webhook payload, normalizes cost/budget telemetry, and emits a structured mitigation ladder without taking destructive action. This workflow keeps a deterministic ladder of observation, constraint, and approval stages so the portfolio can show cost governance coverage while waiting for explicit authorization before enacting changes.
