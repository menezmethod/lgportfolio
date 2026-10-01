import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { configured } = vi.hoisted(() => ({ configured: vi.fn() }));
vi.mock("@/lib/firestore", () => ({ isFirestoreConfigured: configured }));
import { GET } from "@/app/api/chat/storage/route";

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
