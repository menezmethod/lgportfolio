'use client';

import { useState, useEffect } from 'react';
import { Lock, MessageSquare, ChevronRight, Bot, User } from 'lucide-react';
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

  // Login gate: same layout and styling as Administration Board
  if (!storedSecret && !sessions.length) {
    return (
      <div className="min-h-screen bg-[#0d1117] pt-20 px-4 flex items-center justify-center">
        <Card className="p-6 max-w-sm w-full bg-[#161b22] border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="size-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold text-gray-200">Conversations</h1>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            View chat sessions (read-only). Use the same admin secret as the Administration Board.
          </p>
          <Input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadSessions()}
            className="mb-3 font-mono bg-[#0d1117] border-white/10 text-gray-200"
          />
          {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
          <Button onClick={loadSessions} className="w-full">Enter</Button>
          <Link href="/admin/board" className="block mt-3 text-center text-sm text-gray-500 hover:text-gray-300">Administration Board</Link>
        </Card>
      </div>
    );
  }

  // Main view: match Board dark theme and chrome
  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4 py-6 border-b border-white/5 mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="size-5 text-emerald-400" />
            <h1 className="text-xl font-bold font-mono">Conversations</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/board">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">Board</Button>
            </Link>
            <Link href="/admin/logs">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">Logs</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-400 hover:text-gray-200">
              Log out
            </Button>
          </div>
        </header>

        {!sessions.length && !loading && (
          <div className="flex items-center gap-2">
            <Button onClick={loadSessions} variant="outline" size="sm" className="border-white/20 text-gray-400">Load sessions</Button>
          </div>
        )}
        {loading && <p className="text-sm text-gray-500">Loading…</p>}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {sessions.map((s) => (
              <Card
                key={s.session_id}
                className={`p-3 cursor-pointer transition-colors bg-[#161b22] border-white/10 hover:border-emerald-500/30 ${
                  selectedId === s.session_id ? 'ring-2 ring-emerald-500/50 border-emerald-500/30' : ''
                }`}
                onClick={() => loadDetail(s.session_id)}
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
            {detail && (
              <Card className="p-4 bg-[#161b22] border-white/10">
                {detail.session && (
                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <p>Started: {formatTs(detail.session.started_at)}</p>
                    <p>Last activity: {formatTs(detail.session.last_activity_at)}</p>
                    <p>Messages: {detail.session.message_count} · Engagement: {detail.session.engagement_score ?? 0}</p>
                    {detail.session.recruiter_email && <p className="text-emerald-400">Email: {detail.session.recruiter_email}</p>}
                  </div>
                )}
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {detail.messages.map((m, i) => (
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
      </div>
    </div>
  );
}
