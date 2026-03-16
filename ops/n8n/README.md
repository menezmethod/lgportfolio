# n8n Workflow Assets

Versioned workflow imports and helper scripts for the Pi 5 control plane live here.

- `workflows/site-sentinel.json` is the first production-facing control-plane workflow.
- `workflows/dns-ssl-guardian.json` detects public DNS drift, hostname coverage gaps, and HTTPS failures using public probes plus DNS-over-HTTPS.
- `workflows/deploy-guardian.json` runs post-deploy smoke checks and packages the outcome for ops review.
- `workflows/cost-governor.json` models a mitigation ladder and approval guardrail for runaway spend.
- `workflows/inference-router.json` demonstrates local-first inference with NVIDIA fallback and deterministic final fallback.
- `scripts/site_sentinel_probe.mjs` is an optional standalone probe helper for out-of-band drills.
- Import with the n8n CLI from inside the running container.
- Publish or activate only after a manual execution succeeds.

## Runtime rules

- Use **Code nodes** for shaping data, branching logic, and audit payloads.
- Use **HTTP Request nodes** for outbound network calls like Slack and NVIDIA. The Pi runtime does not expose `process` or browser-style `fetch` inside the JS task runner.
- Use `$env` in expressions and Code nodes, not `process.env`.
- Safe drill mode is enabled with `CONTROL_PLANE_DRILL=1`. That forces monitor workflows to emit notifications without requiring a real outage.

## Current platform constraints

- This n8n instance currently uses **SQLite**, so `n8n execute --id=...` can contend with the live runtime and fail with `SQLITE_BUSY`.
- Public production webhook URLs for `deploy-guardian` and `cost-governor` are still not registering on this instance even though the workflows activate cleanly.
- The reliable test path today is:
  - import the versioned workflow
  - publish it
  - activate it
  - verify activation in container logs
  - run drills from the UI or migrate the instance to Postgres for cleaner CLI execution

Example import flow:

```bash
docker cp ops/n8n/workflows/site-sentinel.json menez-n8n-1:/tmp/site-sentinel.json
docker exec -u node menez-n8n-1 n8n import:workflow --input=/tmp/site-sentinel.json --userId=<USER_ID>
docker exec -u node menez-n8n-1 n8n publish:workflow --id=<WORKFLOW_ID>
docker restart menez-n8n-1
```

Manual test without stopping the running n8n instance:

```bash
docker exec -u node \
  -e N8N_RUNNERS_BROKER_PORT=5681 \
  -e N8N_PORT=5682 \
  -e CONTROL_PLANE_DRILL=1 \
  menez-n8n-1 \
  n8n execute --id=<WORKFLOW_ID>
```

If you need repeatable CLI drills while the editor stays online, move n8n storage from SQLite to Postgres first.
