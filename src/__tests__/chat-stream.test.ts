import { describe, it, expect } from "vitest";
import { readTextStream } from "@/lib/chat-stream";

describe("readTextStream", () => {
  it("reports partial text before the stream ends", async () => {
    const enc = new TextEncoder();
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({ start: (c) => (controller = c) });
    const seen: string[] = [];
    const done = readTextStream(body, (t) => seen.push(t));

    controller.enqueue(enc.encode("Hel"));
    await new Promise((r) => setTimeout(r, 5));
    expect(seen).toEqual(["Hel"]); // visible while the stream is still open

    controller.enqueue(enc.encode("lo wor"));
    await new Promise((r) => setTimeout(r, 5));
    expect(seen).toEqual(["Hel", "Hello wor"]);

    controller.enqueue(enc.encode("ld"));
    controller.close();
    expect(await done).toBe("Hello world");
    expect(seen.at(-1)).toBe("Hello world");
  });

  it("handles a multi-byte character split across chunks", async () => {
    const bytes = new TextEncoder().encode("é");
    const body = new ReadableStream<Uint8Array>({
      start(c) { c.enqueue(bytes.slice(0, 1)); c.enqueue(bytes.slice(1)); c.close(); },
    });
    expect(await readTextStream(body, () => {})).toBe("é");
  });
});
