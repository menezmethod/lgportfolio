/**
 * Security module for LLM chat API.
 *
 * Defenses implemented (mapped to OWASP Top 10 for LLM 2026):
 *   LLM01 — Prompt Injection: pattern-based detection + input sanitization
 *   LLM02 — Sensitive Info Disclosure: output scoping in system prompt
 *   LLM07 — System Prompt Leakage: extraction-attempt detection
 *   LLM08 — Vector/Embedding Weaknesses: zero-width char stripping
 *   LLM10 — Unbounded Consumption: length limits + message count caps
 */

const MAX_MESSAGE_LENGTH = 1500;
const MAX_MESSAGES_IN_CONTEXT = 8;
const MAX_TOTAL_CHARS = 8000;

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|prior|above|system)/i,
  /forget\s+(all\s+)?(previous|prior|above|system)/i,
  /override\s+(system|previous|prior)/i,

  /\[\s*system\s*\]\s*:/i,
  /<\s*system\s*>/i,
  /\[end\s+(of\s+)?system\s+prompt\]/i,
  /---\s*end\s+system/i,
  /new\s+system\s+prompt/i,
  /\[INST\]/i,
  /<<\s*SYS\s*>>/i,

  /you\s+are\s+now\s+(a|an|the)\s+/i,
  /pretend\s+(to\s+be|you\s+are)/i,
  /act\s+as\s+(if|a|an|the)\s+/i,
  /roleplay\s+as/i,
  /switch\s+to\s+.*\s+mode/i,
  /enter\s+.*\s+mode/i,
  /jailbreak/i,
  /DAN\s+mode/i,

  /repeat\s+(your|the)\s+(system|initial|original|full)\s+(prompt|instructions|message)/i,
  /what\s+(are|is|were)\s+your\s+(system|initial|original|hidden)\s+(prompt|instructions)/i,
  /show\s+(me\s+)?your\s+(system|initial|original)\s+(prompt|instructions)/i,
  /reveal\s+your\s+(system|initial)\s+(prompt|instructions|rules)/i,
  /output\s+(the\s+)?(above|system|initial)\s+(text|prompt|instructions)/i,
  /print\s+your\s+(system|initial)\s+(prompt|instructions)/i,
  /dump\s+(your\s+)?(system|prompt|instructions)/i,

  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /os\.(system|exec|popen|remove)/i,
  /subprocess\.(run|call|Popen)/i,
  /require\s*\(\s*['"]child_process/i,
  /__import__/i,

  /fetch\s*\(\s*['"]https?:\/\//i,
  /XMLHttpRequest/i,
  /window\.location/i,
  /document\.cookie/i,
  /\.innerHTML\s*=/i,
  /<script[\s>]/i,
  /javascript:/i,
];

export interface SecurityCheckResult {
  safe: boolean;
  reason?: string;
  sanitized?: string;
}

export function sanitizeInput(content: string): SecurityCheckResult {
  if (!content || typeof content !== "string") {
    return { safe: false, reason: "Invalid input." };
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    return {
      safe: false,
      reason: `Message too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.`,
    };
  }

  const cleaned = content
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF\u00AD]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();

  if (cleaned.length === 0) {
    return { safe: false, reason: "Empty message." };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(cleaned)) {
      return {
        safe: false,
        reason:
          "I can only answer questions about Luis Gimenez's professional background. Please ask about his experience, skills, or projects.",
      };
    }
  }

  return { safe: true, sanitized: cleaned };
}

interface ChatMessage {
  role: string;
  content: string;
}

export function validateMessages(messages: unknown): SecurityCheckResult & { parsed?: ChatMessage[] } {
  if (!Array.isArray(messages)) {
    return { safe: false, reason: "Invalid request format." };
  }

  if (messages.length === 0) {
    return { safe: false, reason: "No messages provided." };
  }

  if (messages.length > MAX_MESSAGES_IN_CONTEXT) {
    return {
      safe: false,
      reason: `Too many messages. Maximum ${MAX_MESSAGES_IN_CONTEXT} allowed per request.`,
    };
  }

  let totalChars = 0;
  const parsed: ChatMessage[] = [];

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      return { safe: false, reason: "Invalid message format." };
    }

    const m = msg as Record<string, unknown>;

    if (typeof m.role !== "string" || !["user", "assistant"].includes(m.role)) {
      return { safe: false, reason: "Invalid message role." };
    }

    if (typeof m.content !== "string") {
      return { safe: false, reason: "Invalid message content." };
    }

    if (m.content.length > MAX_MESSAGE_LENGTH) {
      return { safe: false, reason: "Individual message too long." };
    }

    totalChars += m.content.length;
    if (totalChars > MAX_TOTAL_CHARS) {
      return { safe: false, reason: "Total conversation too long." };
    }

    parsed.push({ role: m.role, content: m.content });
  }

  return { safe: true, parsed };
}
