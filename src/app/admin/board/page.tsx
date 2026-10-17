"use client";

import { useCallback, useEffect, useState } from "react";

type Tab = "system" | "recruiters" | "logs" | "metrics";
const TABS: { id: Tab; label: string }[] = [
  { id: "system", label: "System" },
  { id: "recruiters", label: "Recruiters" },
  { id: "logs", label: "Logs" },
  { id: "metrics", label: "Metrics" },
];

interface Session {
  session_id: string;
  last_activity_at?: unknown;
  message_count?: number;
  engagement_score?: number;
  status?: string;
  recruiter_email?: string | null;
}
interface LogEntry {
  timestamp?: string;
  severity?: string;
  message?: string;
  trace_id?: string;
  endpoint?: string;
}

function fmtDate(v: unknown): string {
  try {
    const o = v as { _seconds?: number; seconds?: number } | string | number;
    const ms = typeof o === "object" && o ? (o._seconds ?? o.seconds ?? 0) * 1000 : new Date(o as string | number).getTime();
    return ms ? new Date(ms).toLocaleString() : "unknown";
  } catch {
    return "unknown";
  }
}

export default function AdminBoard() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("system");

  const api = useCallback(
    (path: string, init?: RequestInit) =>
      fetch(path, { ...init, headers: { ...(init?.headers ?? {}), "x-admin-secret": secret }, cache: "no-store" }),
    [secret],
  );

  // Restore a secret saved for this browser tab only, and the requested tab.
  useEffect(() => {
    try {
      const s = sessionStorage.getItem("adminSecret");
      if (s) setSecret(s);
      const t = new URLSearchParams(window.location.search).get("tab") as Tab | null;
      if (t && TABS.some((x) => x.id === t)) setTab(t);
    } catch {}
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const r = await fetch("/api/admin/board/view", { headers: { "x-admin-secret": secret }, cache: "no-store" }).catch(() => null);
    if (r?.ok) {
      setAuthed(true);
      try {
        sessionStorage.setItem("adminSecret", secret);
      } catch {}
    } else {
      setError(r?.status === 401 ? "Wrong secret." : "Could not reach the server.");
    }
  };

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-8">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-4 text-3xl font-medium tracking-[-0.03em]">Administration board</h1>
        <form onSubmit={login} className="mt-8 space-y-4">
          <label htmlFor="secret" className="eyebrow block">Admin secret</label>
          <input
            id="secret"
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoComplete="off"
            className="min-h-11 w-full rounded-md border border-hairline bg-card px-3 outline-none focus:border-foreground"
          />
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
          <button type="submit" className="btn-pill">Open board</button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-4 text-3xl font-medium tracking-[-0.03em]">Administration board</h1>
      <div role="tablist" aria-label="Board sections" className="mt-6 flex flex-wrap gap-2 border-b border-hairline pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-11 rounded-md border px-4 text-sm ${tab === t.id ? "border-foreground bg-foreground text-background" : "border-hairline"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "system" && <System />}
        {tab === "recruiters" && <Recruiters api={api} />}
        {tab === "logs" && <Logs api={api} />}
        {tab === "metrics" && <Metrics api={api} />}
      </div>
    </div>
  );
}

type Api = (path: string, init?: RequestInit) => Promise<Response>;

function System() {
  const [d, setD] = useState<Record<string, any> | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/war-room/data", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setD)
      .catch((e) => setErr(`Could not load telemetry (${e.message}).`));
  }, []);
  if (err) return <p role="alert">{err}</p>;
  if (!d) return <p className="text-ink-soft">Loading.</p>;
  const rows: [string, string][] = [
    ["Status", `${d.service_status.status} (source: ${d.metrics_source})`],
    ["Requests", String(d.request_metrics.total_24h)],
    ["p50 / p95", `${d.request_metrics.latency_p50} ms / ${d.request_metrics.latency_p95} ms`],
    ["Server errors (1h)", `${d.request_metrics.error_rate_1h.toFixed(1)}%`],
    ["Chat conversations", String(d.chat_metrics.conversations_24h)],
    ["Daily budget left", String(d.chat_metrics.budget_remaining)],
    ["Recent errors", String(d.recent_errors.length)],
  ];
  return (
    <div>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([k, v]) => (
          <div key={k} className="border-t border-hairline pt-3">
            <dt className="eyebrow">{k}</dt>
            <dd className="mt-1 text-lg">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-sm text-ink-soft">
        Same data as the public <a href="/war-room" className="link-under text-foreground">War Room</a>. Visitor details are not exposed by that API.
      </p>
    </div>
  );
}

function Recruiters({ api }: { api: Api }) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [stats, setStats] = useState<{ sessions_last_n_days: number; sessions_with_email: number } | null>(null);
  const [open, setOpen] = useState<{ id: string; messages: { role: string; content: string }[] } | null>(null);
  useEffect(() => {
    api("/api/admin/sessions?limit=50").then((r) => r.json()).then((j) => setSessions(j.sessions ?? [])).catch(() => setSessions([]));
    api("/api/admin/board/stats").then((r) => r.json()).then(setStats).catch(() => {});
  }, [api]);
  const load = async (id: string) => {
    const j = await api(`/api/admin/sessions/${encodeURIComponent(id)}`).then((r) => r.json()).catch(() => null);
    setOpen({ id, messages: j?.messages ?? [] });
  };
  if (!sessions) return <p className="text-ink-soft">Loading.</p>;
  return (
    <div>
      {stats && (
        <p className="text-sm text-ink-soft">
          Last 7 days: {stats.sessions_last_n_days} sessions, {stats.sessions_with_email} with an email.
        </p>
      )}
      {sessions.length === 0 ? (
        <p className="mt-4 max-w-2xl">
          No saved sessions. Either no chats have been saved yet, or Firestore is not configured (set FIREBASE_SERVICE_ACCOUNT_JSON on the app). Without it, chats are not stored.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="eyebrow">
              <tr><th className="py-2">Last activity</th><th>Messages</th><th>Engagement</th><th>Status</th><th>Email</th><th /></tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.session_id} className="border-t border-hairline">
                  <td className="py-2">{fmtDate(s.last_activity_at)}</td>
                  <td>{s.message_count ?? 0}</td>
                  <td>{s.engagement_score ?? 0}</td>
                  <td>{s.status ?? ""}</td>
                  <td>{s.recruiter_email || ""}</td>
                  <td><button onClick={() => load(s.session_id)} className="link-under min-h-11">Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <div className="mt-6 border-t border-hairline pt-4">
          <p className="eyebrow">Conversation {open.id.slice(0, 8)}</p>
          {open.messages.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">No saved messages for this session.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {open.messages.map((m, i) => (
                <li key={i} className="text-sm"><span className="eyebrow mr-2">{m.role}</span><span className="whitespace-pre-wrap break-words">{m.content}</span></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Logs({ api }: { api: Api }) {
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [note, setNote] = useState("");
  const [minutes, setMinutes] = useState("60");
  const [severity, setSeverity] = useState("");
  useEffect(() => {
    setEntries(null);
    setNote("");
    api(`/api/admin/logs?limit=100&minutes=${minutes}${severity ? `&severity=${severity}` : ""}`)
      .then((r) => r.json())
      .then((j) => {
        setEntries(j.entries ?? []);
        if (j.error) setNote(j.error);
      })
      .catch(() => {
        setEntries([]);
        setNote("Could not load logs.");
      });
  }, [api, minutes, severity]);
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">Range
          <select value={minutes} onChange={(e) => setMinutes(e.target.value)} className="ml-2 min-h-11 rounded-md border border-hairline bg-card px-2">
            <option value="15">15 min</option><option value="60">1 hour</option><option value="360">6 hours</option><option value="1440">24 hours</option>
          </select>
        </label>
        <label className="text-sm">Severity
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="ml-2 min-h-11 rounded-md border border-hairline bg-card px-2">
            <option value="">All</option><option value="ERROR">Error</option><option value="WARNING">Warning</option><option value="INFO">Info</option>
          </select>
        </label>
      </div>
      {!entries ? (
        <p className="mt-4 text-ink-soft">Loading.</p>
      ) : entries.length === 0 ? (
        <p className="mt-4 max-w-2xl">
          {note === "Logging not configured"
            ? "Cloud Logging is not configured. This tab reads Google Cloud Logging and needs GOOGLE_CLOUD_PROJECT and Google credentials, which a Coolify deployment does not have by default. Read this site's logs in the Coolify UI (structured JSON on stdout) instead."
            : note || "No log entries in this range."}
        </p>
      ) : (
        <ul className="mt-4 space-y-1 font-mono text-xs">
          {entries.map((e, i) => (
            <li key={i} className="break-words border-t border-hairline py-1">{e.timestamp} {e.severity} {e.endpoint} {e.message} {e.trace_id}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Metrics({ api }: { api: Api }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    api("/api/metrics").then((r) => r.text()).then(setText).catch(() => setText("Could not load metrics."));
  }, [api]);
  return text === null ? <p className="text-ink-soft">Loading.</p> : <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs">{text}</pre>;
}
