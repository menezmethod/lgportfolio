---
title: About
headline: Software engineer.
headlineAccent: Go backend to platform and reliability.
buildItems:
  - title: Run the telemetry apps
    icon: eye
    description: >-
      The Home Services internal telemetry apps are Python and Go services on GCP that ingest
      Salesforce data into BigQuery for Grafana.
  - title: Put change on a safe path
    icon: shield
    description: >-
      I built the deployment path that lets non-developers ship to production through the gates:
      security scanning, static analysis, hardened base images, production readiness, branch
      protection, and rollback planning. The first application went through it and it became the pattern.
  - title: Write the code that does it
    icon: git-branch
    description: >-
      Go authorization services on CockroachDB for The Home Depot's payments platform, and a
      metrics ETL, from design through production readiness.
principles:
  - title: Check the query before the schema
    description: >-
      I cut a star schema after the real Grafana and alerting queries showed the normalization
      had no payoff.
  - title: Tie every alert to a user impact
    description: >-
      Each alert maps to a Critical User Journey step and a runbook. Volume-aware thresholds
      replaced time-based muting, and a peer cross-checked them.
  - title: Bring in the on-call engineer
    description: >-
      When other teams ask me to pull logs and scope impact, I bring in the formal on-call
      engineer. I stay a helper on the incident.
---

I started as a Go backend engineer on Enterprise Payments at **The Home Depot**: through Daugherty Business Solutions, contracting at The Home Depot from April 2022, then a Software Engineer II at The Home Depot from January 2024. I wrote authorization services on CockroachDB and carried the on-call rotation.

In March 2026 I moved to Home Services as a Site Reliability Engineer. The work includes the telemetry apps, SLO and alerting tooling, and the deployment path for non-developers. I helped define the SLO and Critical User Journey model.

I hold 2x Bravo awards from The Home Depot.

Before Home Depot I freelanced for small businesses (Menez Enterprises, 2018 to 2022) and built web applications at a real-estate company (2015 to 2018).

I'm based in Tampa Bay, FL, and I'm a U.S. citizen. Remote U.S. is preferred. A light hybrid arrangement near Tampa works too.
