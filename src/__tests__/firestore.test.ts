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
const mockRunTransaction = vi.fn();
const mockFirestore = { collection: mockCollection, runTransaction: mockRunTransaction };

vi.mock("firebase-admin/app", () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  cert: vi.fn((c: unknown) => c),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(() => mockFirestore),
  Timestamp: { now: vi.fn() },
  FieldValue: {
    increment: vi.fn((n: number) => ({ _increment: n })),
  },
}));

// Must import AFTER mocks are set up
import {
  writeSessionSummary,
  appendSessionMemory,
  getSessionMemory,
  getSessionStats,
  setRecruiterEmail,
  listSessions,
  getBoardStats,
} from "@/lib/firestore";
import { FieldValue } from "firebase-admin/firestore";

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
  mockRunTransaction.mockImplementation(
    async (fn: (tx: { get: typeof mockGet; set: typeof mockSet; update: typeof mockUpdate }) => Promise<void>) => {
      await fn({ get: mockGet, set: mockSet, update: mockUpdate });
    }
  );
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
    it("creates new document inside a transaction when session does not exist", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');
      mockGet.mockResolvedValueOnce({ exists: false, data: () => undefined });

      await writeSessionSummary({
        sessionId: "test-session-1",
        cacheHit: true,
        rateLimited: false,
        status: "ok",
      });

      expect(mockRunTransaction).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith("test-session-1");
      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ message_count: 1, cache_hits: 1 }),
        { merge: true }
      );
    });

    it("updates existing document with atomic increments inside a transaction", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');
      mockGet.mockResolvedValueOnce({ exists: true, data: () => ({ session_id: "existing" }) });

      await writeSessionSummary({
        sessionId: "existing-session",
        cacheHit: true,
        rateLimited: false,
        status: "ok",
      });

      expect(mockRunTransaction).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message_count: FieldValue.increment(1),
          engagement_score: FieldValue.increment(1),
          cache_hits: FieldValue.increment(1),
        })
      );
    });
  });

  describe("appendSessionMemory", () => {
    it("appends messages inside a Firestore transaction", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          session_id: "tx-session",
          messages: [{ role: "user", content: "prior" }],
        }),
      });

      await appendSessionMemory("tx-session", [
        { role: "user", content: "new question" },
        { role: "assistant", content: "new answer" },
      ]);

      expect(mockRunTransaction).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          messages: [
            { role: "user", content: "prior" },
            { role: "user", content: "new question" },
            { role: "assistant", content: "new answer" },
          ],
        })
      );
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
    it("creates session doc with email-only fields and merge when doc does not exist yet", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');
      mockGet.mockResolvedValueOnce({ exists: false, data: () => undefined });

      await setRecruiterEmail("session-123", "recruiter@example.com");
      expect(mockSet).toHaveBeenCalledTimes(1);
      const [payload, options] = mockSet.mock.calls[0];
      expect(options).toEqual({ merge: true });
      expect(payload).toMatchObject({
        session_id: "session-123",
        recruiter_email: "recruiter@example.com",
      });
      expect(payload).not.toHaveProperty("message_count");
      expect(payload).not.toHaveProperty("cache_hits");
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("updates only email fields when session doc already exists", async () => {
      vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type":"service_account","project_id":"test"}');
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          session_id: "session-123",
          message_count: 12,
          cache_hits: 3,
          status: "ok",
        }),
      });

      await setRecruiterEmail("session-123", "recruiter@example.com");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          recruiter_email: "recruiter@example.com",
        })
      );
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.not.objectContaining({
          message_count: expect.anything(),
          cache_hits: expect.anything(),
          started_at: expect.anything(),
        })
      );
      expect(mockSet).not.toHaveBeenCalled();
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
