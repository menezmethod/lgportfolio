import { describe, it, expect } from "vitest";
import { APP_VERSION } from "@/lib/version";

describe("version", () => {
  it("exports a semver string from package.json", () => {
    expect(APP_VERSION).toBeDefined();
    expect(typeof APP_VERSION).toBe("string");
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("matches the version in package.json", async () => {
    const pkg = await import("../../package.json");
    expect(APP_VERSION).toBe(pkg.version);
  });
});
