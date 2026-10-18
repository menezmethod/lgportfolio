#!/usr/bin/env node
/**
 * Copy the career-ops applications tracker into the private D1 table `applications`
 * (workers/rag/migrations/0003_applications.sql) so visit digests can say
 * "Astra, applied 2026-09-10". Prints the tagged gimenez.dev link for each open
 * application. The tracker data never enters this repository.
 *
 * Usage:
 *   node scripts/sync-applications.mjs ~/career-ops-data/data/applications.md [--dry-run]
 *
 * Tags: <company-slug> for the most recent application to a company, and
 * <company-slug>-<tracker #> for every application.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const [file, ...flags] = process.argv.slice(2);
if (!file) {
  console.error("Usage: node scripts/sync-applications.mjs <applications.md> [--dry-run]");
  process.exit(1);
}
const DRY = flags.includes("--dry-run");
const SKIP = new Set(["skip", "discarded", "evaluated"]);

const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
const sql = (s) => (s == null || s === "" ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);

const rows = readFileSync(file, "utf8")
  .split("\n")
  .filter((l) => /^\|\s*\d+\s*\|/.test(l))
  .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
  .map(([num, date, company, role, , status]) => ({ num, date, company, role, status }))
  .filter((r) => r.company && !SKIP.has(r.status.toLowerCase()));

const byTag = new Map();
for (const r of [...rows].sort((a, b) => a.date.localeCompare(b.date) || Number(a.num) - Number(b.num))) {
  const base = slug(r.company);
  if (!base) continue;
  byTag.set(base, r); // latest application wins the short tag
  byTag.set(`${base}-${r.num}`, r);
}

const statements = [
  "DELETE FROM applications;",
  ...[...byTag].map(
    ([src, r]) =>
      `INSERT INTO applications (src, company, role, applied_at, status) VALUES (${sql(src)}, ${sql(r.company)}, ${sql(r.role)}, ${sql(r.date)}, ${sql(r.status)});`
  ),
];

console.log(`${rows.length} applications, ${byTag.size} tags.`);
console.log("\nTagged links for open applications (status Applied / Responded / Interview):");
for (const [src, r] of byTag) {
  if (/-\d+$/.test(src) || !/^(applied|responded|interview)/i.test(r.status)) continue;
  console.log(`  https://gimenez.dev/?src=${src}   ${r.company} — ${r.role} (${r.date}, ${r.status})`);
}

if (DRY) {
  console.log("\n[dry run] nothing written.");
  process.exit(0);
}
const dir = mkdtempSync(join(tmpdir(), "apps-"));
try {
  const f = join(dir, "applications.sql");
  writeFileSync(f, statements.join("\n"));
  execFileSync("npx", ["--yes", "wrangler@4", "d1", "execute", "lgportfolio-chat", "--remote", "--file", f, "--config", "workers/rag/wrangler.jsonc"], { stdio: ["ignore", "ignore", "inherit"] });
  console.log(`\nWrote ${byTag.size} rows to D1 applications.`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
