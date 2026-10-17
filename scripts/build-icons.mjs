#!/usr/bin/env node
// Renders src/app/icon.svg to public/icons/icon-192.png and icon-512.png with headless Chrome.
// Usage: node scripts/build-icons.mjs   (set CHROME to override the browser path)
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const svg = readFileSync("src/app/icon.svg", "utf8");
for (const size of [192, 512]) {
  const dir = mkdtempSync(join(tmpdir(), "icon-"));
  const html = join(dir, "i.html");
  writeFileSync(html, `<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  execFileSync(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000", `--window-size=${size},${size}`, `--screenshot=public/icons/icon-${size}.png`, `file://${html}`], { stdio: "ignore" });
  console.log("wrote", `public/icons/icon-${size}.png`);
}
