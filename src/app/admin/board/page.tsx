'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, LayoutDashboard, MessageSquare, FileText, Gauge, Loader2, RefreshCw, ExternalLink, LogOut, ChevronRight, Bot, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { WarRoomDashboard, type WarRoomData } from '@/components/war-room/WarRoomDashboard';

type TabId = 'system' | 'recruiters' | 'logs' | 'metrics';

interface SessionSummary {
  session_id: string;
  started_at: { _seconds?: number } | string;
  last_activity_at: { _seconds?: number } | string;
  message_count: number;
  engagement_score?: number;
  recruiter_email?: string | null;
  status: string;
}

interface SessionDetail {
  session: SessionSummary | null;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface LogEntry {
  timestamp: string;
  severity: string;
  message: string;
  trace_id: string;
  endpoint: string;
}

function formatTs(ts: { _seconds?: number } | string): string {
  if (typeof ts === 'string') return new Date(ts).toLocaleString();
  const s = (ts as { _seconds?: number })._seconds;
  if (s) return new Date(s * 1000).toLocaleString();
  return '—';
}

export default function AdminBoardPage() {
  const [secret, setSecret] = useState('');
  const [storedSecret, setStoredSecret] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('system');
  const [warRoomData, setWarRoomData] = useState<WarRoomData | null>(null);
  const [warRoomLoading, setWarRoomLoading] = useState(false);
  const [warRoomError, setWarRoomError] = useState<string | null>(null);
  const [warRoomLastFetch, setWarRoomLastFetch] = useState('');
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [logsEntries, setLogsEntries] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsMinutes, setLogsMinutes] = useState(60);
  const [logsSeverity, setLogsSeverity] = useState('');
  const [logsProjectId, setLogsProjectId] = useState('');
  const [metricsText, setMetricsText] = useState('');
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [boardStats, setBoardStats] = useState<{ sessions_last_n_days: number; sessions_with_email: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const s = sessionStorage.getItem('admin_secret');
      if (s) setStoredSecret(s);
    }
  }, []);

  const token = storedSecret || secret;
  const authHeader = useCallback(() => ({ 'X-Admin-Secret': token }), [token]);

  const fetchWarRoom = useCallback(async () => {
    setWarRoomLoading(true);
    setWarRoomError(null);
    try {
      const res = await fetch('/api/war-room/data', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setWarRoomData(json);
      setWarRoomLastFetch(new Date().toLocaleTimeString());
    } catch (e) {
      setWarRoomError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setWarRoomLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    if (!token) return;
    setSessionsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/sessions?limit=50', { headers: authHeader() });
      if (res.status === 401) {
        setError('Invalid secret');
        return;
      }
      const data = await res.json();
      setSessions(data.sessions || []);
      if (token && !storedSecret && typeof window !== 'undefined') {
        sessionStorage.setItem('admin_secret', token);
        setStoredSecret(token);
      }
    } catch {
      setError('Failed to load sessions');
    } finally {
      setSessionsLoading(false);
    }
  }, [token, storedSecret, authHeader]);

  const fetchSessionDetail = useCallback(async (id: string) => {
    setSelectedSessionId(id);
    setSessionDetail(null);
    try {
      const res = await fetch(`/api/admin/sessions/${id}`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setSessionDetail(data);
      }
    } catch {
      setSessionDetail({ session: null, messages: [] });
    }
  }, [authHeader]);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100', minutes: String(logsMinutes) });
      if (logsSeverity) params.set('severity', logsSeverity);
      const res = await fetch(`/api/admin/logs?${params}`, { headers: authHeader() });
      if (res.status === 401) return;
      const data = await res.json();
      setLogsEntries(data.entries || []);
      if (data.project_id) setLogsProjectId(data.project_id);
      if (token && !storedSecret && typeof window !== 'undefined') {
        sessionStorage.setItem('admin_secret', token);
        setStoredSecret(token);
      }
    } finally {
      setLogsLoading(false);
    }
  }, [token, storedSecret, logsMinutes, logsSeverity, authHeader]);

  const fetchMetrics = useCallback(async () => {
    if (!token) return;
    setMetricsLoading(true);
    try {
      const res = await fetch('/api/metrics', { headers: authHeader() });
      if (res.ok) setMetricsText(await res.text());
      else setMetricsText(`Error: ${res.status}`);
    } finally {
      setMetricsLoading(false);
    }
  }, [token, authHeader]);

  // Only ping board/view when we have a stored (validated) secret so every request sends auth.
  useEffect(() => {
    if (!storedSecret) return;
    fetch('/api/admin/board/view', { headers: { 'X-Admin-Secret': storedSecret } }).catch(() => {});
  }, [storedSecret]);

  useEffect(() => {
    if (activeTab === 'system' && token) {
      fetchWarRoom();
      const interval = setInterval(fetchWarRoom, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, token, fetchWarRoom]);

  const fetchBoardStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/board/stats?days=7', { headers: authHeader() });
      if (res.ok) setBoardStats(await res.json());
    } catch {
      // ignore
    }
  }, [token, authHeader]);

  useEffect(() => {
    if (activeTab === 'recruiters' && token) {
      fetchSessions();
      fetchBoardStats();
    }
  }, [activeTab, token, fetchSessions, fetchBoardStats]);

  useEffect(() => {
    if (activeTab === 'logs' && token) fetchLogs();
  }, [activeTab, token, fetchLogs]);

  useEffect(() => {
    if (activeTab === 'metrics' && token) fetchMetrics();
  }, [activeTab, token, fetchMetrics]);

  const logout = () => {
    sessionStorage.removeItem('admin_secret');
    setStoredSecret('');
    setWarRoomData(null);
    setSessions([]);
    setSessionDetail(null);
    setSelectedSessionId(null);
    setLogsEntries([]);
    setError('');
  };

  if (!storedSecret && !sessions.length) {
    return (
      <div className="min-h-screen bg-[#0d1117] pt-20 px-4 flex items-center justify-center">
        <Card className="p-6 max-w-sm w-full bg-[#161b22] border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="size-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold text-gray-200">Administration Board</h1>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            One pane for system health, recruiter activity, logs, and Prometheus metrics.
          </p>
          <Input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSessions()}
            className="mb-3 font-mono bg-[#0d1117] border-white/10 text-gray-200"
          />
          {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
          <Button onClick={fetchSessions} className="w-full">Enter</Button>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'system' as const, label: 'System', icon: LayoutDashboard },
    { id: 'recruiters' as const, label: 'Recruiters', icon: MessageSquare },
    { id: 'logs' as const, label: 'Logs', icon: FileText },
    { id: 'metrics' as const, label: 'Metrics', icon: Gauge },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4 py-6 border-b border-white/5 mb-6">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="size-5 text-emerald-400" />
            <h1 className="text-xl font-bold font-mono">Administration Board</h1>
            <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-400/20">v2</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/conversations">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">Conversations</Button>
            </Link>
            <Link href="/admin/logs">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">Logs</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-400 hover:text-gray-200">
              <LogOut className="size-4 mr-1" /> Log out
            </Button>
          </div>
        </header>

        <nav className="flex flex-wrap gap-1 mb-6 border-b border-white/5 pb-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t font-mono text-sm transition-colors ${
                activeTab === id
                  ? 'bg-white/10 text-emerald-400 border border-b-0 border-white/20 -mb-0.5'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>

        {activeTab === 'system' && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchWarRoom} disabled={warRoomLoading} className="border-white/20 text-gray-400">
                {warRoomLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                <span className="ml-1.5">Refresh</span>
              </Button>
            </div>
            <WarRoomDashboard
              data={warRoomData}
              loading={warRoomLoading}
              error={warRoomError}
              lastFetch={warRoomLastFetch}
              compact={false}
            />
          </section>
        )}

        {activeTab === 'recruiters' && (
          <section className="space-y-4">
            {boardStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-4 bg-[#161b22] border-white/10">
                  <div className="text-xs font-mono text-gray-500 uppercase">Sessions (7d)</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{boardStats.sessions_last_n_days}</div>
                </Card>
                <Card className="p-4 bg-[#161b22] border-white/10">
                  <div className="text-xs font-mono text-gray-500 uppercase">With email</div>
                  <div className="text-2xl font-bold font-mono text-blue-400 mt-1">{boardStats.sessions_with_email}</div>
                </Card>
              </div>
            )}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-mono text-gray-500 uppercase">Chat sessions (last 50)</h2>
              <Button variant="outline" size="sm" onClick={fetchSessions} disabled={sessionsLoading} className="border-white/20 text-gray-400">
                {sessionsLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                <span className="ml-1.5">Refresh</span>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {sessions.map((s) => (
                  <Card
                    key={s.session_id}
                    className={`p-3 cursor-pointer transition-colors bg-[#161b22] border-white/10 hover:border-emerald-500/30 ${
                      selectedSessionId === s.session_id ? 'ring-2 ring-emerald-500/50 border-emerald-500/30' : ''
                    }`}
                    onClick={() => fetchSessionDetail(s.session_id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-gray-300 truncate">{s.session_id.slice(0, 12)}…</span>
                      <ChevronRight className="size-4 text-gray-500 shrink-0" />
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>{s.message_count} msgs</span>
                      <span>{formatTs(s.last_activity_at)}</span>
                      {s.recruiter_email && <span className="text-emerald-400">{s.recruiter_email}</span>}
                    </div>
                  </Card>
                ))}
              </div>
              <div className="min-h-[200px]">
                {sessionDetail && (
                  <Card className="p-4 bg-[#161b22] border-white/10">
                    {sessionDetail.session && (
                      <div className="text-xs text-gray-500 mb-4 space-y-1">
                        <p>Started: {formatTs(sessionDetail.session.started_at)}</p>
                        <p>Last activity: {formatTs(sessionDetail.session.last_activity_at)}</p>
                        <p>Messages: {sessionDetail.session.message_count} · Engagement: {sessionDetail.session.engagement_score ?? 0}</p>
                        {sessionDetail.session.recruiter_email && <p className="text-emerald-400">Email: {sessionDetail.session.recruiter_email}</p>}
                      </div>
                    )}
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                      {sessionDetail.messages.map((m, i) => (
                        <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                          {m.role === 'assistant' && <Bot className="size-4 shrink-0 text-emerald-400 mt-0.5" />}
                          <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${m.role === 'user' ? 'bg-emerald-500/20 text-gray-200' : 'bg-white/5 text-gray-300'}`}>
                            {m.content}
                          </div>
                          {m.role === 'user' && <User className="size-4 shrink-0 text-gray-500 mt-0.5" />}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'logs' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-mono text-gray-500">
                Last
                <select
                  value={logsMinutes}
                  onChange={(e) => setLogsMinutes(Number(e.target.value))}
                  className="ml-2 rounded border border-white/10 bg-[#161b22] px-2 py-1 text-sm text-gray-300"
                >
                  <option value={15}>15 min</option>
                  <option value={60}>1 hour</option>
                  <option value={360}>6 hours</option>
                  <option value={1440}>24 hours</option>
                </select>
              </label>
              <label className="text-sm font-mono text-gray-500">
                Severity
                <select
                  value={logsSeverity}
                  onChange={(e) => setLogsSeverity(e.target.value)}
                  className="ml-2 rounded border border-white/10 bg-[#161b22] px-2 py-1 text-sm text-gray-300"
                >
                  <option value="">All</option>
                  <option value="ERROR">ERROR</option>
                  <option value="WARNING">WARNING</option>
                  <option value="INFO">INFO</option>
                </select>
              </label>
              <Button size="sm" onClick={fetchLogs} disabled={logsLoading} className="bg-white/10 text-gray-200 hover:bg-white/20 border-0">
                {logsLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                <span className="ml-1.5">Refresh</span>
              </Button>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#161b22] overflow-hidden">
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#0d1117] border-b border-white/10">
                    <tr>
                      <th className="text-left p-3 font-mono text-gray-500">Time</th>
                      <th className="text-left p-3 font-mono text-gray-500">Severity</th>
                      <th className="text-left p-3 font-mono text-gray-500">Message</th>
                      <th className="text-left p-3 font-mono text-gray-500">Trace / Endpoint</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsEntries.map((e, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-3 font-mono text-xs text-gray-500 whitespace-nowrap">{e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}</td>
                        <td className="p-3">
                          <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                            e.severity === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                            e.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-gray-500'
                          }`}>{e.severity || '—'}</span>
                        </td>
                        <td className="p-3 text-gray-300 break-all max-w-md">{e.message || '—'}</td>
                        <td className="p-3 font-mono text-xs text-gray-500">
                          {e.trace_id && logsProjectId ? (
                            <a href={`https://console.cloud.google.com/logs/query;query=trace%3D%22${e.trace_id}%22;project=${logsProjectId}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-1">
                              {e.trace_id.slice(0, 12)}… <ExternalLink className="size-3" />
                            </a>
                          ) : e.trace_id ? <span>{e.trace_id.slice(0, 16)}…</span> : null}
                          {e.endpoint && <span className="ml-1">{e.endpoint}</span>}
                          {!e.trace_id && !e.endpoint && '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'metrics' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-gray-500 font-mono">
                Prometheus text exposition format. Use <code className="bg-white/10 px-1 rounded">X-Admin-Secret</code> when scraping.
              </p>
              <div className="flex items-center gap-2">
                <a href="/api/metrics" target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-emerald-400 hover:underline inline-flex items-center gap-1">
                  Open /api/metrics <ExternalLink className="size-3" />
                </a>
                <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={metricsLoading} className="border-white/20 text-gray-400">
                  {metricsLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  <span className="ml-1.5">Refresh</span>
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#161b22] overflow-hidden">
              <pre className="p-4 text-xs font-mono text-gray-400 overflow-x-auto max-h-[70vh] overflow-y-auto whitespace-pre-wrap break-all">
                {metricsText || (metricsLoading ? 'Loading…' : 'Click Refresh to load.')}
              </pre>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
