/** Short, truthful family label for a Workers AI model id, e.g. "@cf/meta/llama-3.1-8b-instruct-fast" -> "llama 3.1 8B". */
export function modelFamily(model: string | undefined | null): string {
  if (!model) return "";
  const name = model.split("/").pop() ?? model;
  const m = name.match(/^([a-z]+)-(\d+(?:\.\d+)?)-(\d+)b/i);
  return m ? `${m[1]} ${m[2]} ${m[3]}B` : name;
}
