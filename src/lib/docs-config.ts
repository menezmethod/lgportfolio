/**
 * Documentation index and navigation for the /docs section.
 * Single source of truth for sidebar order and display titles.
 */

export interface DocEntry {
  slug: string;
  file: string;
  title: string;
}

export const docsNav: DocEntry[] = [
  { slug: "setup", file: "SETUP.md", title: "Setup" },
  { slug: "deploy", file: "DEPLOY-CLOUDRUN.md", title: "Deployment (Cloud Run)" },
  { slug: "n8n-control-plane", file: "N8N-CONTROL-PLANE.md", title: "Edge Control Plane (n8n)" },
  { slug: "gcp-observability", file: "GCP-OBSERVABILITY-MAP.md", title: "GCP Observability (Console & Mobile)" },
  { slug: "traffic-cost", file: "TRAFFIC-AND-COST.md", title: "Traffic & Cost" },
  { slug: "ci-tests", file: "CI-AND-TESTS.md", title: "CI & Tests" },
  { slug: "decisions", file: "DECISIONS.md", title: "Decisions" },
  { slug: "debugging-chat", file: "DEBUGGING-CHAT.md", title: "Debugging (Chat & RAG)" },
  { slug: "chat-secrets", file: "CHAT-SECRETS.md", title: "Chat & Secrets (GCP)" },
  { slug: "admin-board", file: "ADMIN-BOARD.md", title: "Administration Board" },
];

export const adrNav: DocEntry[] = [
  { slug: "adr/001", file: "adr/001-single-cloud-run-instance.md", title: "ADR-001: Single Cloud Run Instance" },
  { slug: "adr/002", file: "adr/002-page-visibility-war-room-polling.md", title: "ADR-002: Page Visibility (War Room)" },
  { slug: "adr/003", file: "adr/003-chat-node-runtime-not-edge.md", title: "ADR-003: Chat Node Runtime" },
];

export const allDocs: DocEntry[] = [...docsNav, ...adrNav];

export function getDocBySlug(slug: string | string[]): DocEntry | undefined {
  const key = Array.isArray(slug) ? slug.join("/") : slug;
  return allDocs.find((d) => d.slug === key);
}
