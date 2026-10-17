# ADR-002: Page Visibility API for War Room Polling

**Status:** Accepted
**Date:** 2026-02

## Context

The War Room dashboard polls `/api/war-room/data` every 10 seconds for live telemetry. If users leave the tab open in the background (common for dashboards), this generates continuous requests even when nobody is watching — wasting Cloud Run resources and counting against rate limits.

## Decision

Use the Page Visibility API (`document.visibilitychange`) to start/stop the polling interval. Polling only runs when `document.visibilityState === 'visible'`. When the tab becomes hidden, the interval is cleared. When the tab becomes visible again, data is fetched immediately and the interval restarts.

## Consequences

- **Positive:** Zero requests from background tabs. Reduces Cloud Run invocations and stays within free-tier quotas. Honest telemetry — the dashboard reflects real-time data only when someone is actually viewing it.
- **Negative:** If a user switches back to the tab after a long period, there is a brief moment of stale data before the first fetch completes. This is negligible (< 1 second).
- **Note:** The Administration Board (`/admin/board`) uses the same pattern for its System tab (War Room embed).
- **Update (2026-03):** Polling interval increased to 60s (low-traffic cost); increase to 30s when job hunting (see `docs/TRAFFIC-AND-COST.md`).
