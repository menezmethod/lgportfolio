/** Read a plain-text response body and report the accumulated text after every chunk, so the UI can render tokens as they arrive. */
export async function readTextStream(
  body: ReadableStream<Uint8Array>,
  onText: (accumulated: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const piece = decoder.decode(value, { stream: true });
    if (!piece) continue;
    acc += piece;
    onText(acc);
  }
  const tail = decoder.decode();
  if (tail) {
    acc += tail;
    onText(acc);
  }
  return acc;
}
