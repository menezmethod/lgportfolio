/**
 * Lightweight timing probes for the home page trace, so its rows are never empty.
 *
 * Triggered lazily from /api/war-room/data. Fire and forget: the response never waits on a probe,
 * every probe fails silently, and an in-flight lock plus per-probe attempt times prevent loops.
 *  - Retrieval probe: one fixed query to the RAG worker, when no sample is newer than 15 minutes.
 *  - Inference probe (timed to the first token, like chat): one tiny generation through the same provider chain as chat, at most once
 *    per 6 hours, counted against the daily chat budget, skipped when the budget is low or no
 *    provider is configured.
 * Samples are real measurements of the real path. Nothing is invented: with no sample the row
 * reports "not available".
 */

import { buildChatProviderChain, streamChatWithFallbacks } from "./chat-providers";
import { getDailyBudgetStats, incrementDailyCount } from "./rate-limit";
import { isCloudflareRagConfigured, probeWorkerRetrieval } from "./rag";
import { getChatSpans } from "./telemetry";

const RAG_STALE_MS = 15 * 60 * 1000;
const INFERENCE_EVERY_MS = 6 * 60 * 60 * 1000;
const INFERENCE_RETRY_AFTER_FAILURE_MS = 60 * 60 * 1000;
const MIN_BUDGET_LEFT = 20;

export interface ProbeSample {
  at: number;
  ms: number;
  /** Model that answered the probe (inference probe only). */
  model?: string;
}

export interface ProbeState {
  rag: ProbeSample | null;
  inference: ProbeSample | null;
  /** True when the path can be probed at all (provider configured). */
  rag_configured: boolean;
  inference_configured: boolean;
}

let ragSample: ProbeSample | null = null;
let infSample: ProbeSample | null = null;
let ragLock = false;
let infLock = false;
let lastRagAttempt = 0;
let lastInfAttempt = 0;
let lastInfFailed = false;

export function getProbeState(): ProbeState {
  return {
    rag: ragSample,
    inference: infSample,
    rag_configured: isCloudflareRagConfigured(),
    inference_configured: buildChatProviderChain().length > 0,
  };
}

/** Test hook. */
export function resetProbes(): void {
  ragSample = infSample = null;
  ragLock = infLock = false;
  lastRagAttempt = lastInfAttempt = 0;
  lastInfFailed = false;
}

async function runRagProbe(): Promise<void> {
  try {
    const ms = await probeWorkerRetrieval();
    if (ms !== null) ragSample = { at: Date.now(), ms };
  } catch {
    /* silent */
  } finally {
    ragLock = false;
  }
}

async function runInferenceProbe(): Promise<void> {
  try {
    incrementDailyCount();
    const start = Date.now();
    const { result, attemptMs, model } = await streamChatWithFallbacks({
      system: "Reply with one short word.",
      messages: [{ role: "user", content: "Say ok." }],
      maxOutputTokens: 8,
      temperature: 0,
    });
    // Same definition as the chat span: first token of the succeeding provider attempt (failed attempts excluded).
    infSample = { at: Date.now(), ms: attemptMs ?? Date.now() - start, model };
    // Drain the tiny response so the request completes cleanly.
    await Promise.race([
      result.toTextStreamResponse().text(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("probe timeout")), 20_000)),
    ]);
    lastInfFailed = false;
  } catch {
    lastInfFailed = true;
  } finally {
    infLock = false;
  }
}

/** Start whichever probes are due. Returns immediately. Never throws. */
export function maybeRunProbes(): void {
  try {
    if (process.env.NODE_ENV === "test" || process.env.DISABLE_TRACE_PROBES === "1") return;
    const now = Date.now();
    const chat = getChatSpans();

    // Keeps the retrieval path warm while idle; skipped when the daily budget is low, like the inference probe.
    if (!ragLock && isCloudflareRagConfigured() && getDailyBudgetStats().remaining >= MIN_BUDGET_LEFT) {
      const newest = Math.max(chat.last?.at ?? 0, ragSample?.at ?? 0, lastRagAttempt);
      if (now - newest > RAG_STALE_MS) {
        ragLock = true;
        lastRagAttempt = now;
        void runRagProbe();
      }
    }

    if (!infLock && buildChatProviderChain().length > 0) {
      const wait = lastInfFailed ? INFERENCE_RETRY_AFTER_FAILURE_MS : INFERENCE_EVERY_MS;
      const newest = Math.max(chat.last?.at ?? 0, infSample?.at ?? 0, lastInfAttempt);
      if (now - newest > wait && getDailyBudgetStats().remaining >= MIN_BUDGET_LEFT) {
        infLock = true;
        lastInfAttempt = now;
        void runInferenceProbe();
      }
    }
  } catch {
    /* silent */
  }
}
