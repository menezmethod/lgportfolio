import { describe, it, expect, vi, beforeEach } from "vitest";

async function fresh() {
  vi.resetModules();
  return await import("@/lib/telemetry");
}
const slo = (t: Awaited<ReturnType<typeof fresh>>, name: string) =>
  t.getWarRoomData().slos.find((s) => s.name === name)!;

describe("memory-mode SLOs", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("client 4xx never move the server error or availability SLOs", async () => {
    const t = await fresh();
    for (let i = 0; i < 50; i++) t.recordRequest("/x", "GET", 200, 5);
    for (let i = 0; i < 7; i++) t.recordRequest("/api/chat", "POST", 400, 5);
    expect(slo(t, "Server Error Rate")).toMatchObject({ current: 0, met: true });
    expect(slo(t, "Availability")).toMatchObject({ current: 100, met: true });
  });

  it("availability is measured from 5xx, not hardcoded", async () => {
    const t = await fresh();
    for (let i = 0; i < 90; i++) t.recordRequest("/x", "GET", 200, 5);
    for (let i = 0; i < 10; i++) t.recordRequest("/x", "GET", 500, 5);
    expect(slo(t, "Availability")).toMatchObject({ current: 90, met: false });
    expect(slo(t, "Server Error Rate")).toMatchObject({ current: 10, met: false });
  });
});
