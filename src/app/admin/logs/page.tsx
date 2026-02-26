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

  const authHeader = () => ({ 'X-Admin-Secret': storedSecret || secret });

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
      const res = await fetch(`/api/admin/logs?${params}`, { headers: authHeader() });
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
  }, [storedSecret]);

  const logout = () => {
    sessionStorage.removeItem('admin_secret');
    setStoredSecret('');
    setEntries([]);
    setError(null);
  };

  if (!storedSecret) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4 flex items-center justify-center">
        <Card className="p-6 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="size-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Admin: Logs</h1>
          </div>
          <Input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            className="mb-3 font-mono"
          />
          {error && <p className="text-sm text-destructive mb-2">{error}</p>}
          <Button onClick={fetchLogs} className="w-full">View logs</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="size-5" />
            Cloud Run logs
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/admin/conversations">
              <Button variant="ghost" size="sm">Conversations</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>Log out</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="text-sm font-mono text-muted-foreground">
            Last
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="ml-2 rounded border bg-muted px-2 py-1 text-sm"
            >
              <option value={15}>15 min</option>
              <option value={60}>1 hour</option>
              <option value={360}>6 hours</option>
              <option value={1440}>24 hours</option>
            </select>
          </label>
          <label className="text-sm font-mono text-muted-foreground">
            Severity
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="ml-2 rounded border bg-muted px-2 py-1 text-sm"
            >
              <option value="">All</option>
              <option value="ERROR">ERROR</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
          </label>
          <Button size="sm" onClick={fetchLogs} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            <span className="ml-1.5">{loading ? 'Loading...' : 'Refresh'}</span>
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-mono">
            {error}
          </div>
        )}

        <div className="rounded-lg border bg-card overflow-hidden">
          {entries.length === 0 && !loading ? (
            <div className="p-8 text-center text-muted-foreground font-mono text-sm">
              No log entries. Ensure GOOGLE_CLOUD_PROJECT is set and the Cloud Run service account has roles/logging.viewer.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/95 border-b">
                  <tr>
                    <th className="text-left p-3 font-mono text-muted-foreground">Time</th>
                    <th className="text-left p-3 font-mono text-muted-foreground">Severity</th>
                    <th className="text-left p-3 font-mono text-muted-foreground">Message</th>
                    <th className="text-left p-3 font-mono text-muted-foreground">Trace / Endpoint</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}
                      </td>
                      <td className="p-3">
                        <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                          e.severity === 'ERROR' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                          e.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {e.severity || '—'}
                        </span>
                      </td>
                      <td className="p-3 text-foreground break-all max-w-md">{e.message || '—'}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">
                        {e.trace_id && (
                          projectId ? (
                            <a
                              href={`https://console.cloud.google.com/logs/query;query=trace%3D%22${e.trace_id}%22;project=${projectId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              {e.trace_id.slice(0, 12)}… <ExternalLink className="size-3" />
                            </a>
                          ) : (
                            <span className="font-mono">{e.trace_id.slice(0, 16)}…</span>
                          )
                        )}
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

        <p className="mt-4 text-xs text-muted-foreground font-mono">
          Logs from Cloud Logging (resource.type=cloud_run_revision, service_name=lgportfolio). Use the trace link to open in Logs Explorer.
        </p>
      </div>
    </div>
  );
}
