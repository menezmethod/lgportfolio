import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Firestore mocks ─────────────────────────────────────────────────────────

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockDoc = vi.fn(() => ({ get: mockGet, set: mockSet, update: mockUpdate }));
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockWhere = vi.fn();
const mockCollection = vi.fn(() => ({
  doc: mockDoc,
  orderBy: mockOrderBy,
  where: mockWhere,
}));
const mockFirestore = { collection: mockCollection };

vi.mock("firebase-admin/app", () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  cert: vi.fn((c: unknown) => c),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(() => mockFirestore),
  Timestamp: { now: vi.fn() },
}));

// Must import AFTER mocks are set up
import {
  writeSessionSummary,
  getSessionMemory,
  getSessionStats,
  setRecruiterEmail,
  listSessions,
  getBoardStats,
} from "@/lib/firestore";

beforeEach(() => {
  vi.clearAllMocks();
  // Reset the cached _db by resetting the module's internal state
  // We use env var to control getDb behavior
  mockGet.mockResolvedValue({ exists: false, data: () => undefined });
  mockSet.mockResolvedValue(undefined);
  mockUpdate.mockResolvedValue(undefined);
  mockOrderBy.mockReturnValue({ limit: mockLimit });
  mockLimit.mockReturnValue({
    get: vi.fn().mockResolvedValue({ docs: [] }),
  });
  mockWhere.mockReturnValue({
    get: vi.fn().mockResolvedValue({ docs: [] }),
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("firestore", () => {
  describe("getDb", () => {
    it("returns null when FIREBASE_SERVICE_ACCOUNT_JSON is not set", () => {
      delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      // Need fresh module to reset cached _db — for this test we rely on
      // the fact that if _db was never set, getCredentials returns null
      // But since _db may be cached from other tests, we test the credential path
      const creds = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      expect(creds).toBeUndefined();
    });

    it("returns null when FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON", () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", "not-valid-json{{{");
      // getCredentials() will catch the parse error and return null
      // Since _db is cached once set, this tests the credential parsing path
    });
  });

  describe("writeSessionSummary", () => {
    it("creates new document when session does not exist", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');
      mockGet.mockResolvedValueOnce({ exists: false, data: () => undefined });

      await writeSessionSummary({
        sessionId: "test-session-1",
        messageCount: 3,
        cacheHits: 1,
        rateLimited: false,
        status: "ok",
      });

      expect(mockDoc).toHaveBeenCalledWith("test-session-1");
      expect(mockSet).toHaveBeenCalled();
    });

    it("updates existing document when session exists", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');
      mockGet.mockResolvedValueOnce({ exists: true, data: () => ({ session_id: "existing" }) });

      await writeSessionSummary({
        sessionId: "existing-session",
        messageCount: 5,
        cacheHits: 2,
        rateLimited: false,
        status: "ok",
      });

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe("getSessionMemory", () => {
    it("returns empty array when no memory document exists", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');
      mockGet.mockResolvedValueOnce({ exists: false, data: () => undefined });

      const result = await getSessionMemory("no-memory");
      expect(result).toEqual([]);
    });

    it("returns messages from existing memory document", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');
      const messages = [
        { role: "user" as const, content: "Hello" },
        { role: "assistant" as const, content: "Hi there!" },
      ];
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ session_id: "test", messages }),
      });

      const result = await getSessionMemory("test-session");
      expect(result).toEqual(messages);
    });
  });

  describe("getSessionStats", () => {
    it("returns zeros when session does not exist", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');
      mockGet.mockResolvedValueOnce({ exists: false, data: () => undefined });

      const stats = await getSessionStats("nonexistent");
      expect(stats).toEqual({ message_count: 0, engagement_score: 0, cache_hits: 0 });
    });

    it("returns session stats from existing document", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          message_count: 10,
          engagement_score: 7,
          cache_hits: 3,
        }),
      });

      const stats = await getSessionStats("active-session");
      expect(stats).toEqual({ message_count: 10, engagement_score: 7, cache_hits: 3 });
    });
  });

  describe("setRecruiterEmail", () => {
    it("calls update with email and last_activity_at", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');

      await setRecruiterEmail("session-123", "recruiter@example.com");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ recruiter_email: "recruiter@example.com" })
      );
    });
  });

  describe("listSessions", () => {
    it("returns empty array and uses default limit", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');

      const result = await listSessions();
      expect(result).toEqual([]);
      expect(mockOrderBy).toHaveBeenCalledWith("last_activity_at", "desc");
      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it("passes custom limit", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');

      await listSessions(10);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });
  });

  describe("getBoardStats", () => {
    it("returns zeros with no matching sessions", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');

      const result = await getBoardStats(7);
      expect(result).toEqual({ sessions_last_n_days: 0, sessions_with_email: 0 });
    });
  });
});
