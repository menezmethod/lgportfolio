import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DEFAULT_INFERENCIA_CHAT_MODEL,
  DEFAULT_INFERENCIA_BASE_URL_COOLIFY,
  getInferenciaChatModel,
  getInferenciaBaseUrl,
  inferenciaModelsUrl,
} from "@/lib/inferencia-config";

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("inferencia-config", () => {
  it("defaults chat model to gemma4:12b", () => {
    delete process.env.INFERENCIA_CHAT_MODEL;
    expect(getInferenciaChatModel()).toBe(DEFAULT_INFERENCIA_CHAT_MODEL);
    expect(DEFAULT_INFERENCIA_CHAT_MODEL).toBe("gemma4:12b");
  });

  it("uses COOLIFY default base URL when env unset", () => {
    delete process.env.INFERENCIA_BASE_URL;
    vi.stubEnv("COOLIFY", "1");
    expect(getInferenciaBaseUrl()).toBe(DEFAULT_INFERENCIA_BASE_URL_COOLIFY);
  });

  it("builds models URL from base URL", () => {
    expect(inferenciaModelsUrl("http://inferencia:8080/v1")).toBe("http://inferencia:8080/v1/models");
  });
});
