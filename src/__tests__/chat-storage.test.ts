import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { configured } = vi.hoisted(() => ({ configured: vi.fn() }));
vi.mock("@/lib/firestore", () => ({ isFirestoreConfigured: configured }));
import { GET } from "@/app/api/chat/storage/route";
import { getChatLimits, checkRateLimit, getDailyBudgetStats } from "@/lib/rate-limit";

describe("chat storage state", () => {
  it("reports storage ON", async () => {
    configured.mockReturnValue(true);
    expect(await (await GET()).json()).toMatchObject({ storage: true });
  });
  it("reports storage OFF", async () => {
    configured.mockReturnValue(false);
    expect(await (await GET()).json()).toMatchObject({ storage: false });
  });
  it("chat page branches its notice and email box on the flag; privacy covers both states", () => {
    const chat = readFileSync(join(process.cwd(), "src/app/chat/page.tsx"), "utf8");
    expect(chat).toContain("Chats are not saved.");
    expect(chat).toMatch(/storage === true && messages\.length > 2/);
    expect(chat).not.toContain("Chats may be saved");
    const priv = readFileSync(join(process.cwd(), "src/app/privacy/page.tsx"), "utf8");
    expect(priv).toContain("When storage is enabled");
    expect(priv).toContain("not saved at all");
  });
});

describe("effective chat limits come from the server env", () => {
  it("defaults when unset", async () => {
    vi.stubEnv("CHAT_MAX_RPM_PER_IP", "");
    vi.stubEnv("CHAT_MAX_MESSAGES_PER_SESSION", "");
    vi.stubEnv("NEXT_PUBLIC_CHAT_MAX_MESSAGES", "");
    vi.stubEnv("CHAT_DAILY_BUDGET", "");
    configured.mockReturnValue(false);
    expect(await (await GET()).json()).toMatchObject({ maxMessagesPerSession: 30, maxRpmPerIp: 6, dailyBudget: 150 });
    vi.unstubAllEnvs();
  });
  it("3 / 20 / 100 reach the UI and the enforcing code identically", async () => {
    vi.stubEnv("CHAT_MAX_RPM_PER_IP", "3");
    vi.stubEnv("CHAT_MAX_MESSAGES_PER_SESSION", "20");
    vi.stubEnv("CHAT_DAILY_BUDGET", "100");
    vi.stubEnv("NEXT_PUBLIC_CHAT_MAX_MESSAGES", "7"); // legacy second source must not win
    configured.mockReturnValue(false);
    expect(await (await GET()).json()).toMatchObject({ maxMessagesPerSession: 20, maxRpmPerIp: 3, dailyBudget: 100 });
    expect(getChatLimits()).toEqual({ maxMessagesPerSession: 20, maxRpmPerIp: 3, dailyBudget: 100 });
    expect(getDailyBudgetStats().max).toBe(100);
    const ip = "198.51.100.77";
    expect(checkRateLimit(ip).allowed).toBe(true);
    expect(checkRateLimit(ip).allowed).toBe(true);
    expect(checkRateLimit(ip).allowed).toBe(true);
    const blocked = checkRateLimit(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.message).toContain("3 questions per minute");
    vi.unstubAllEnvs();
  });
  it("junk values fall back to defaults", () => {
    vi.stubEnv("CHAT_MAX_RPM_PER_IP", "abc");
    vi.stubEnv("CHAT_DAILY_BUDGET", "-5");
    expect(getChatLimits()).toMatchObject({ maxRpmPerIp: 6, dailyBudget: 150 });
    vi.unstubAllEnvs();
  });
});
