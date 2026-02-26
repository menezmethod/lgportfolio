import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

export const maxDuration = 30;

const DEFAULT_BASE_URL = process.env.INFERENCIA_BASE_URL || "";
const DEFAULT_CHAT_MODEL = process.env.INFERENCIA_CHAT_MODEL || "mlx-community/gpt-oss-20b-MXFP4-Q8";

const SYSTEM_PROMPT = `You are a DevOps/SRE assistant. The user will paste an error message or log line from their application.
Your job: explain what the error means in plain language and suggest 1–3 concrete fixes. Be concise (under 150 words).
Do not make up stack traces or code. If the error is unclear, say so and suggest how to get more context (e.g. check logs, trace_id).`;

export async function POST(req: Request) {
  const apiKey = process.env.INFERENCIA_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Inference API not configured" }),
      { status: 503, headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const errorText = (body as { error_text?: string }).error_text?.trim() || "";
    if (!errorText) {
      return new Response(
        JSON.stringify({ error: "Missing error_text" }),
        { status: 400, headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" } }
      );
    }

    const baseURL = process.env.INFERENCIA_BASE_URL || DEFAULT_BASE_URL;
    const model = process.env.INFERENCIA_CHAT_MODEL || DEFAULT_CHAT_MODEL;
    const openai = createOpenAI({ baseURL, apiKey });

    const { text } = await generateText({
      model: openai.chat(model),
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Explain this error and suggest fixes:\n\n${errorText.slice(0, 2000)}` }],
      maxRetries: 1,
      maxOutputTokens: 300,
      temperature: 0.3,
    });

    return new Response(JSON.stringify({ explanation: text }), {
      status: 200,
      headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(
      JSON.stringify({ error: "Explain failed", message: msg }),
      { status: 503, headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" } }
    );
  }
}
