'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, FileText, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface LogEntry {
  timestamp: string;
  severity: string;
  message: string;
  trace_id: string;
  endpoint: string;
  fields?: Record<string, unknown>;
}

export default function AdminLogsPage() {
  const [secret, setSecret] = useState('');
  const [storedSecret, setStoredSecret] = useState('');
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(60);
  const [severity, setSeverity] = useState('');
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const s = sessionStorage.getItem('admin_secret');
      if (s) setStoredSecret(s);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    const token = storedSecret || secret;
    if (!token) {
      setError('Enter admin secret');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100', minutes: String(minutes) });
      if (severity) params.set('severity', severity);
      const res = await fetch(`/api/admin/logs?${params}`, {
        headers: { 'X-Admin-Secret': token },
      });
      if (res.status === 401) {
        setError('Invalid secret');
        return;
      }
      const data = await res.json();
      setEntries(data.entries || []);
      if (data.project_id) setProjectId(data.project_id);
      if (data.error && !data.entries?.length) setError(data.message || data.error);
      if (token && !storedSecret && typeof window !== 'undefined') {
        sessionStorage.setItem('admin_secret', token);
        setStoredSecret(token);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [storedSecret, secret, minutes, severity]);

  useEffect(() => {
    if (storedSecret && entries.length === 0 && !loading) fetchLogs();
    // Intentionally only re-run when storedSecret changes (initial load); adding fetchLogs/loading/entries would re-fetch on every state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedSecret]);

  const logout = () => {
    sessionStorage.removeItem('admin_secret');
    setStoredSecret('');
    setEntries([]);
    setError(null);
  };

  if (!storedSecret) {
    return (
      <div className="min-h-screen bg-[#0d1117] pt-20 px-4 flex items-center justify-center">
        <Card className="p-6 max-w-sm w-full bg-[#161b22] border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="size-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold text-gray-200">Logs</h1>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            View Cloud Run logs. Use the same admin secret as the Administration Board.
          </p>
          <Input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            className="mb-3 font-mono bg-[#0d1117] border-white/10 text-gray-200"
          />
          {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
          <Button onClick={fetchLogs} className="w-full">Enter</Button>
          <Link href="/admin/board" className="block mt-3 text-center text-sm text-gray-500 hover:text-gray-300">Administration Board</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4 py-6 border-b border-white/5 mb-6">
          <div className="flex items-center gap-3">
            <FileText className="size-5 text-emerald-400" />
            <h1 className="text-xl font-bold font-mono">Logs</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/board">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">Board</Button>
            </Link>
            <Link href="/admin/conversations">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">Conversations</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-400 hover:text-gray-200">Log out</Button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="text-sm font-mono text-gray-500">
            Last
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
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
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="ml-2 rounded border border-white/10 bg-[#161b22] px-2 py-1 text-sm text-gray-300"
            >
              <option value="">All</option>
              <option value="ERROR">ERROR</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
          </label>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="border-white/20 text-gray-400">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            <span className="ml-1.5">{loading ? 'Loading…' : 'Refresh'}</span>
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-mono">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-white/10 bg-[#161b22] overflow-hidden">
          {entries.length === 0 && !loading ? (
            <div className="p-8 text-center text-gray-500 font-mono text-sm">
              No log entries. Ensure GOOGLE_CLOUD_PROJECT is set and the Cloud Run service account has roles/logging.viewer.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
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
                  {entries.map((e, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 font-mono text-xs text-gray-500 whitespace-nowrap">{e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}</td>
                      <td className="p-3">
                        <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                          e.severity === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                          e.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-gray-500'
                        }`}>{e.severity || '—'}</span>
                      </td>
                      <td className="p-3 text-gray-300 break-all max-w-md">{e.message || '—'}</td>
                      <td className="p-3 font-mono text-xs text-gray-500">
                        {e.trace_id && projectId ? (
                          <a href={`https://console.cloud.google.com/logs/query;query=trace%3D%22${e.trace_id}%22;project=${projectId}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-1">
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
          )}
        </div>

        <p className="mt-4 text-xs text-gray-500 font-mono">
          Logs from Cloud Logging (resource.type=cloud_run_revision, service_name=lgportfolio). Use the trace link to open in Logs Explorer.
        </p>
      </div>
    </div>
  );
}
