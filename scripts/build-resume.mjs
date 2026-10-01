#!/usr/bin/env node
// Build public/Luis-Gimenez-Resume.pdf from the CV source of truth (career-ops cv.md).
// Usage: node scripts/build-resume.mjs /path/to/cv.md
// Needs Google Chrome for the headless print step (set CHROME to override the path).
import { existsSync, readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const src = process.argv[2];
if (!src) throw new Error("usage: build-resume.mjs <cv.md>");
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (t) =>
  esc(t)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*(.+?)\*(?=[\s).,]|$)/g, "$1<em>$2</em>");

// Drop the HTML comment block (fact-check notes), then apply the resume-only edits below.
let text = readFileSync(src, "utf8").replace(/<!--[\s\S]*?-->/g, "");
text = text
  .replace(/^\*\*Software Engineer \| Site Reliability \| Production Systems\*\*$/m, "**Software Engineer | Platform & Reliability | Go, GCP, Observability**")
  // Bravo awards: no reasons.
  .replace(/ Two Bravo awards \([^)]*\)\./g, "")
  .replace(/^- \*\*The Home Depot[^\n]*Bravo Award[^\n]*$/m, "- **2x Bravo awards**, The Home Depot")
  .replace(/proactive-detection/g, "early-detection");
// Skills: keep three lines, and carry the integration names into the cloud line.
{
  const keep = ["Languages & Backend", "Cloud & Platform", "Reliability & Observability"];
  text = text
    .split("\n")
    .filter((l) => !/^\*\*(Data & Delivery|Integration & Payments|Practices):\*\*/.test(l))
    .map((l) => (l.startsWith("**Cloud & Platform:**") ? l + ", Salesforce / Apigee / Copado integrations" : l))
    .join("\n");
  void keep;
}
// Public-safe wording. The substitution rules that generalize employer-internal names and figures
// live OUTSIDE the repo, in a private file, so this public script does not list what it hides.
// Format: a JSON array of { "pattern": "<regex source>", "flags": "g", "replace": "<text>" }.
// Default path: .private/resume-redactions.json (gitignored). Override with RESUME_REDACTIONS_FILE.
const redactionsPath = process.env.RESUME_REDACTIONS_FILE || ".private/resume-redactions.json";
if (!existsSync(redactionsPath)) {
  console.error(
    `Missing private redactions file: ${redactionsPath}\n` +
      "This file holds the regex substitutions that generalize employer-internal detail in cv.md before the PDF is built.\n" +
      "It is kept out of the repository on purpose. Restore it from your private backup, or set RESUME_REDACTIONS_FILE to its location.",
  );
  process.exit(1);
}
const PUBLIC_SAFE = JSON.parse(readFileSync(redactionsPath, "utf8")).map((r) => [new RegExp(r.pattern, r.flags ?? "g"), r.replace]);
// Flatten wrapped bullet lines so the patterns above match across source line breaks.
text = text.replace(/\n {2,}(?=\S)/g, " ");
for (const [re, to] of PUBLIC_SAFE) text = text.replace(re, to);

// Voice: no em or en dashes in the output.
text = text.replace(/ — /g, ", ").replace(/ – /g, " to ").replace(/–/g, "-");
const lines = text.split("\n");

let html = "";
let inList = false;
const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };
let para = [];
const flushPara = () => { if (para.length) { html += `<p>${inline(para.join(" "))}</p>`; para = []; } };
let bullet = null;
const flushBullet = () => { if (bullet !== null) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${inline(bullet)}</li>`; bullet = null; } };

let headerDone = false;
let inRole = false;
const closeRole = () => { if (inRole) { html += "</section>"; inRole = false; } };
for (const raw of lines) {
  const l = raw.replace(/\s+$/, "");
  if (l.startsWith("# ")) { html += `<h1>${esc(l.slice(2))}</h1>`; continue; }
  if (l.startsWith("## ")) { flushBullet(); flushPara(); closeList(); closeRole(); html += `<h2>${esc(l.slice(3))}</h2>`; headerDone = true; continue; }
  if (l.startsWith("### ")) { flushBullet(); flushPara(); closeList(); closeRole(); html += `<section class="role"><h3>${inline(l.slice(4))}</h3>`; inRole = true; continue; }
  if (/^- /.test(l)) { flushBullet(); flushPara(); bullet = l.slice(2); continue; }
  if (/^\s{2,}\S/.test(l) && bullet !== null) { bullet += " " + l.trim(); continue; }
  if (l.trim() === "") { flushBullet(); flushPara(); closeList(); continue; }
  if (!headerDone) { flushBullet(); html += `<div class="hdr">${inline(l)}</div>`; continue; }
  if (/^\*.+\*$/.test(l.trim())) { flushPara(); html += `<div class="meta">${inline(l.trim())}</div>`; continue; }
  if (/^\*\*[^*]+:\*\*/.test(l.trim())) flushPara();
  para.push(l.trim());
}
flushBullet(); flushPara(); closeList(); closeRole();

const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Luis Gimenez, Resume</title>
<style>
@page { size: Letter; margin: 0.45in 0.6in; }
body { font: 9.45pt/1.33 -apple-system, "Helvetica Neue", Arial, sans-serif; color: #111; }
h1 { font-size: 22pt; margin: 0 0 2pt; letter-spacing: -0.02em; }
.hdr { color: #333; margin: 0 0 1pt; }
h2 { font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.12em; border-bottom: 0.75pt solid #999; padding-bottom: 2pt; margin: 11pt 0 5pt; }
h3 { font-size: 10.3pt; margin: 6pt 0 0; }
.meta { color: #444; margin-bottom: 2pt; }
ul { margin: 2pt 0 0; padding-left: 13pt; } li { margin: 0 0 1.5pt; } p { margin: 0 0 3pt; }
h2, h3, .meta { break-after: avoid; }
li { break-inside: avoid; }
</style></head><body>${html}</body></html>`;

const dir = mkdtempSync(join(tmpdir(), "resume-"));
const htmlPath = join(dir, "resume.html");
writeFileSync(htmlPath, doc);
execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=public/Luis-Gimenez-Resume.pdf`, `file://${htmlPath}`], { stdio: "inherit" });
console.log("wrote public/Luis-Gimenez-Resume.pdf from", src);
