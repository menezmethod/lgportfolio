'use client';

import { useState, useEffect } from 'react';
import { Lock, MessageSquare, ChevronRight, Bot, User, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface SessionSummary {
  session_id: string;
  started_at: { _seconds?: number } | string;
  last_activity_at: { _seconds?: number } | string;
  message_count: number;
  cache_hits: number;
  rate_limited: boolean;
  status: string;
  engagement_score?: number;
  recruiter_email?: string | null;
}

interface SessionDetail {
  session: SessionSummary | null;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function formatTs(ts: { _seconds?: number } | string): string {
  if (typeof ts === 'string') return new Date(ts).toLocaleString();
  const s = (ts as { _seconds?: number })._seconds;
  if (s) return new Date(s * 1000).toLocaleString();
  return '—';
}

export default function AdminConversationsPage() {
  const [secret, setSecret] = useState('');
  const [storedSecret, setStoredSecret] = useState('');
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const s = sessionStorage.getItem('admin_secret');
      if (s) setStoredSecret(s);
    }
  }, []);

  const authHeader = () => ({ 'X-Admin-Secret': storedSecret || secret });

  const loadSessions = async () => {
    const token = storedSecret || secret;
    if (!token) { setError('Enter admin secret'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/sessions?limit=50', { headers: authHeader() });
      if (res.status === 401) { setError('Invalid secret'); return; }
      const data = await res.json();
      setSessions(data.sessions || []);
      if (token && !storedSecret && typeof window !== 'undefined') {
        sessionStorage.setItem('admin_secret', token);
        setStoredSecret(token);
      }
    } catch {
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/sessions/${id}`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } catch {
      setDetail({ session: null, messages: [] });
    }
  };

  const logout = () => {
    sessionStorage.removeItem('admin_secret');
    setStoredSecret('');
    setSessions([]);
    setDetail(null);
    setSelectedId(null);
  };

  if (!storedSecret && !sessions.length) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4 flex items-center justify-center">
        <Card className="p-6 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="size-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Admin: Chat sessions</h1>
          </div>
          <Input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadSessions()}
            className="mb-3 font-mono"
          />
          {error && <p className="text-sm text-destructive mb-2">{error}</p>}
          <Button onClick={loadSessions} className="w-full">View sessions</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="size-5" />
            Chat sessions (read-only)
          </h1>
          <Link href="/admin/logs">
            <Button variant="ghost" size="sm"><FileText className="size-4 mr-1" /> Logs</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>Log out</Button>
        </div>

        {!sessions.length && !loading && (
          <Button onClick={loadSessions}>Load sessions</Button>
        )}
        {loading && <p className="text-muted-foreground">Loading…</p>}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            {sessions.map((s) => (
              <Card
                key={s.session_id}
                className={`p-3 cursor-pointer transition-colors ${selectedId === s.session_id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                onClick={() => loadDetail(s.session_id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs truncate">{s.session_id.slice(0, 8)}…</span>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {s.message_count} msgs · {formatTs(s.last_activity_at)}
                  {s.recruiter_email && ` · ${s.recruiter_email}`}
                </div>
              </Card>
            ))}
          </div>

          <div>
            {detail && (
              <Card className="p-4">
                {detail.session && (
                  <div className="text-xs text-muted-foreground mb-4 space-y-1">
                    <p>Started: {formatTs(detail.session.started_at)}</p>
                    <p>Last activity: {formatTs(detail.session.last_activity_at)}</p>
                    <p>Messages: {detail.session.message_count} · Engagement: {detail.session.engagement_score ?? 0}</p>
                    {detail.session.recruiter_email && <p>Email: {detail.session.recruiter_email}</p>}
                  </div>
                )}
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {detail.messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}
                    >
                      {m.role === 'assistant' && <Bot className="size-4 shrink-0 text-primary mt-0.5" />}
                      <div
                        className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                          m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                      >
                        {m.content}
                      </div>
                      {m.role === 'user' && <User className="size-4 shrink-0 text-muted-foreground mt-0.5" />}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
