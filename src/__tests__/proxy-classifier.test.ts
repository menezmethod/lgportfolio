import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("proxy visitor classification", () => {
  it("uses the shared classifier instead of its own copy", () => {
    const src = readFileSync(join(process.cwd(), "src/proxy.ts"), "utf8");
    expect(src).toMatch(/import \{[^}]*classifyVisitor[^}]*\} from "\.\/lib\/telemetry"/);
    expect(src).not.toMatch(/function classifyVisitor/);
  });
});
