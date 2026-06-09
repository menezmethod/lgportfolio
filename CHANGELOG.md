# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-04-15

### Added

- Complete Next.js 15 portfolio rebuild with AI recruiter chat
- Vercel AI SDK integration with multi-provider fallback (Gemini → Anthropic → Inferencia → local MLX)
- War Room — live observability dashboard with telemetry engine and Prometheus metrics
- Blog platform with 10+ infrastructure engineering posts
- Firestore session logging with email capture and admin controls
- GCP infrastructure (Cloud Run, ALB, Cloud CDN, Cloud Armor, Terraform)
- GA4 analytics for external links and contact interactions
- Knowledge base system with file-based context management
- Recruiter-style suggested prompts and engagement limits
- Admin board with user logs, error tracing, and budget kill switch
- Chat rate limiting and token/session budgets

### Changed

- Migrated primary deployment from GCP Cloud Run to Vercel
- Upgraded to Next.js 16 with latest dependencies
- Reframed portfolio positioning from edge/IoT to platform engineering
- Tightened cost controls for low-traffic periods
- Replaced Vercel references with Cloud Run docs in README

### Fixed

- Chat scroll and duplicate response issues
- Firestore session document race conditions
- Writing page 404s and email capture session merging
- Admin secret exposure in client code
- Rate limit strictness (6 RPM, 30 msg/session)
- ReactMarkdown rendering and syntax highlighting
