# Documentation source

The documentation visible on the site is published at **[/docs](https://gimenez.dev/docs)** (or `http://localhost:3000/docs` in development). The app renders the markdown files in this folder there with a dedicated layout and navigation.

This folder is the single source of truth for that content. The sidebar and index are driven by `src/lib/docs-config.ts`; add or reorder entries there when you add or rename documents.

## Contents

- **Deployment & setup:** `SETUP.md`, `DEPLOY-CLOUDRUN.md`, `CHAT-SECRETS.md`
- **Operations:** `TRAFFIC-AND-COST.md`, `CI-AND-TESTS.md`, `DEBUGGING-CHAT.md`, `GCP-OBSERVABILITY-MAP.md`
- **Decisions:** `DECISIONS.md`, `ADMIN-BOARD.md`
- **Architecture decision records:** `adr/001-*.md`, `adr/002-*.md`, `adr/003-*.md`

For run, build, deploy, and agent instructions, see the root [README.md](../README.md) and [AGENTS.md](../AGENTS.md).
