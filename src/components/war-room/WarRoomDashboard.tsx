'use client';

import { useState } from 'react';
import { Cpu, Zap, Shield, Database, Radio, Clock, AlertTriangle, BarChart3, Wifi, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { checkDisplay, overallDisplay, MIN_REQUESTS, type Tone } from './status';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

export interface WarRoomData {
  chat_spans?: { samples: number; rag_p50_ms: number; inference_p50_ms: number; last: { at: number; rag_ms: number; inference_ms: number } | null };
  service_status: {
    status: string;
    timestamp: string;
    uptime_seconds: number;
    checks: Record<string, { status: string; latency_ms?: number; budget_remaining?: number }>;
    version: string;
    region: string;
  };
  request_metrics: {
    total_24h: number;
    rpm_current: number;
    error_rate_1h: number;
    latency_p50: number;
    latency_p95: number;
    latency_p99: number;
  };
  chat_metrics: {
    conversations_24h: number;
    avg_inference_ms: number;
    cache_hit_rate: number;
    rate_limit_hits_24h: number;
    budget_used: number;
    budget_remaining: number;
  };
  infrastructure: {
    uptime_seconds: number;
    cold_starts: number;
    node_version: string;
    boot_time: string;
  };
  slos?: Array<{ name: string; target: number; unit: string; current: number; met: boolean }>;
  recent_events: Array<{ timestamp: string; type: string; message: string }>;
  recent_errors: Array<{ timestamp: string; endpoint: string; status_code: number; message: string; trace_id?: string }>;
  recent_visitors?: Array<{ timestamp: string; category: string; path: string; referrer: string; userAgent: string; uaSummary: string }>;
  timeseries: {
    latency_1h: Array<{ t: number; p50: number; p95: number }>;
    requests_1h: Array<{ t: number; count: number; errors: number }>;
  };
  metrics_source?: 'prometheus' | 'memory' | 'hybrid';
  platform?: 'coolify' | 'local';
}

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-emerald-700 dark:text-emerald-400',
  warn: 'text-amber-700 dark:text-amber-400',
  bad: 'text-red-700 dark:text-red-400',
  neutral: 'text-ink-soft',
};
const TONE_BG: Record<Tone, string> = {
  ok: 'bg-emerald-400/10 border-emerald-400/30',
  warn: 'bg-amber-400/10 border-amber-400/30',
  bad: 'bg-red-400/10 border-red-400/30',
  neutral: 'bg-card border-hairline',
};

function StatusDot({ tone }: { tone: Tone }) {
  if (tone === 'neutral') return <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ink-soft/50" />;
  const color = tone === 'ok' ? 'bg-emerald-400' : tone === 'warn' ? 'bg-amber-400' : 'bg-red-400';
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75 motion-reduce:animate-none`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

function formatTime(ts: number | string): string {
  return new Date(Number(ts)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function RecentErrorRow({ error }: { error: { timestamp: string; endpoint: string; status_code: number; message: string; trace_id?: string } }) {
  const [expanded, setExpanded] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    if (loading || explanation) return;
    setLoading(true);
    try {
      const res = await fetch('/api/war-room/explain-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error_text: `${error.endpoint} ${error.status_code}: ${error.message}${error.trace_id ? ` (trace_id: ${error.trace_id})` : ''}` }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setExplanation((data as { explanation?: string }).explanation || 'No explanation returned.');
    } catch (e) {
      setExplanation(e instanceof Error ? e.message : 'Failed to get explanation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-3 hover:bg-muted/50 transition-colors">
      <div className="flex flex-wrap items-start gap-2">
        <span className="text-xs font-mono text-ink-soft min-w-[80px]">{new Date(error.timestamp).toLocaleTimeString()}</span>
        <span className="text-xs font-mono text-red-700 dark:text-red-400">{error.endpoint}</span>
        <span className="text-xs font-mono text-amber-700 dark:text-amber-400">{error.status_code}</span>
        <span className="text-sm text-foreground flex-1 min-w-0 truncate" title={error.message}>{error.message}</span>
        <button
          type="button"
          onClick={() => { setExpanded(!expanded); if (!expanded && !explanation && !loading) handleExplain(); }}
          className="flex items-center gap-1.5 text-xs font-mono text-brand-text hover:text-brand-text shrink-0"
        >
          <Bot className="size-3.5" />
          {loading ? 'Asking AI...' : explanation ? (expanded ? 'Hide' : 'Show') + ' explanation' : 'Explain with AI'}
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>
      {expanded && (explanation || loading) && (
        <div className="mt-3 pl-0 md:pl-20 border-l-2 border-brand/40 bg-muted rounded-r p-3 text-sm text-foreground whitespace-pre-wrap">
          {loading ? <span className="text-ink-soft">Asking the model...</span> : explanation}
        </div>
      )}
    </div>
  );
}

export interface WarRoomDashboardProps {
  data: WarRoomData | null;
  loading?: boolean;
  error?: string | null;
  lastFetch?: string;
  compact?: boolean;
}

export function WarRoomDashboard({ data, loading, error, lastFetch = '', compact = false }: WarRoomDashboardProps) {
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12 text-ink-soft font-mono">
        <span>Initializing telemetry...</span>
      </div>
    );
  }
  if (!data) return null;

  const d = data;
  const checks = d.service_status.checks;
  const budgetMax = d.chat_metrics.budget_used + d.chat_metrics.budget_remaining;
  const thin = d.request_metrics.total_24h < MIN_REQUESTS;
  const budgetPct = budgetMax > 0 ? (d.chat_metrics.budget_used / budgetMax) * 100 : 0;

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-ink-soft">
          <span>Last refresh: {lastFetch || 'pending'}</span>
          <span className="flex flex-wrap items-center gap-2">
            {d.platform && (
              <span className="bg-muted px-1.5 py-0.5 rounded border border-hairline uppercase">{d.platform}</span>
            )}
            {d.metrics_source && (
              <span className={`px-1.5 py-0.5 rounded border uppercase ${
                d.metrics_source === 'prometheus'
                  ? 'bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/20'
                  : 'bg-amber-400/10 text-amber-700 dark:text-amber-400 border-amber-400/20'
              }`}>
                {d.metrics_source === 'prometheus' ? 'prometheus' : `${d.metrics_source} fallback`}
              </span>
            )}
            <span>Region: {d.service_status.region} · v{d.service_status.version}</span>
          </span>
        </div>
      )}
      {error && (
        <div className="p-2 bg-red-400/10 border border-red-400/20 rounded text-red-700 dark:text-red-400 text-xs font-mono">
          Fetch error: {error}
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {(() => {
          const o = overallDisplay(d.service_status.status, d.request_metrics.total_24h);
          return (
            <div className={`p-4 rounded-md border ${TONE_BG[o.tone]} flex flex-col gap-2`}>
              <div className="flex items-center gap-2">
                <StatusDot tone={o.tone} />
                <span className="text-xs font-mono uppercase tracking-wider text-ink-soft">Overall</span>
              </div>
              <span className={`text-lg font-bold font-mono ${TONE_TEXT[o.tone]}`}>{o.label}</span>
              {o.detail && <span className="text-xs text-ink-soft">{o.detail}</span>}
            </div>
          );
        })()}
        {Object.entries(checks).map(([name, check]) => {
          const c = checkDisplay(check.status);
          return (
            <div key={name} className={`p-4 rounded-md border ${TONE_BG[c.tone]} flex flex-col gap-2`}>
              <div className="flex items-center gap-2">
                <StatusDot tone={c.tone} />
                <span className="text-xs font-mono uppercase tracking-wider text-ink-soft truncate">{name.replace(/_/g, ' ')}</span>
              </div>
              <span className={`text-sm font-mono ${TONE_TEXT[c.tone]}`}>
                {c.label}
                {check.latency_ms != null && check.latency_ms > 0 && <span className="text-ink-soft ml-1">{check.latency_ms}ms</span>}
              </span>
            </div>
          );
        })}
      </section>

      {d.slos && d.slos.length > 0 && (
        <section>
          <h3 className="eyebrow mb-3 flex items-center gap-2">
            <Shield className="size-3.5 text-brand-text" /> SLO Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {d.slos.map((slo) => thin ? (
              <div key={slo.name} className="p-3 rounded-md border border-hairline bg-card">
                <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                  <span className="text-xs font-mono text-ink-soft truncate min-w-0">{slo.name}</span>
                  <span className="text-xs font-mono text-ink-soft shrink-0">NO DATA</span>
                </div>
                <p className="text-sm text-ink-soft">Insufficient data (&lt;{MIN_REQUESTS} requests)</p>
              </div>
            ) : (
              <div key={slo.name} className={`p-3 rounded-md border ${slo.met ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-red-400/20 bg-red-400/5'}`}>
                <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                  <span className="text-xs font-mono text-ink-soft truncate min-w-0">{slo.name}</span>
                  <span className={`text-xs font-mono font-bold ${slo.met ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                    {slo.met ? 'MET' : 'BREACH'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-lg font-bold font-mono ${slo.met ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                    {slo.current}
                  </span>
                  <span className="text-xs text-ink-soft font-mono">/ {slo.target}{slo.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: d.metrics_source === 'prometheus' ? 'Cold Starts (24h)' : 'Uptime',
            value: d.metrics_source === 'prometheus'
              ? d.infrastructure.cold_starts.toLocaleString()
              : formatUptime(d.infrastructure.uptime_seconds),
            icon: Clock,
            color: 'text-emerald-700 dark:text-emerald-400',
          },
          { label: 'Requests', value: d.request_metrics.total_24h.toLocaleString(), icon: BarChart3, color: 'text-brand-text' },
          { label: 'P95 Latency', value: `${d.request_metrics.latency_p95}ms`, icon: Zap, color: 'text-amber-700 dark:text-amber-400' },
          { label: 'Error Rate', value: `${d.request_metrics.error_rate_1h.toFixed(1)}%`, icon: AlertTriangle, color: d.request_metrics.error_rate_1h > 5 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400' },
          { label: 'Cache Hit', value: `${d.chat_metrics.cache_hit_rate}%`, icon: Cpu, color: 'text-brand-text' },
          { label: 'Budget Left', value: d.chat_metrics.budget_remaining.toString(), icon: Shield, color: d.chat_metrics.budget_remaining < 20 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400' },
        ].map((m) => (
          <div key={m.label} className="p-4 rounded-md border border-hairline bg-card flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`size-4 ${m.color}`} />
              <span className="eyebrow">{m.label}</span>
            </div>
            <span className={`text-2xl md:text-3xl font-bold font-mono ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </section>

      {!compact && (
        <>
          <section className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-md border border-hairline bg-card">
              <h3 className="eyebrow mb-4 flex items-center gap-2">
                <Zap className="size-3.5 text-amber-700 dark:text-amber-400" /> Request Latency (1h)
              </h3>
              {d.timeseries.latency_1h.length >= 1 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={d.timeseries.latency_1h}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
                    <XAxis dataKey="t" tickFormatter={formatTime} stroke="var(--hairline)" tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} />
                    <YAxis stroke="var(--hairline)" tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} unit="ms" />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--hairline)', color: 'var(--foreground)', borderRadius: 6, fontSize: 12 }} labelFormatter={(l: unknown) => formatTime(Number(l))} />
                    <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'monospace' }} formatter={(v: string) => <span style={{ color: 'var(--ink)' }}>{v}</span>} />
                    <Line type="monotone" dataKey="p50" stroke="var(--live)" strokeWidth={2} dot={true} name="P50" />
                    <Line type="monotone" dataKey="p95" stroke="var(--brand-text)" strokeWidth={2} dot={true} name="P95" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-ink-soft font-mono text-sm">Collecting data. (requests in last 1h will appear here)</div>
              )}
            </div>
            <div className="p-5 rounded-md border border-hairline bg-card">
              <h3 className="eyebrow mb-4 flex items-center gap-2">
                <BarChart3 className="size-3.5 text-brand-text" /> Requests per 10s (1h)
              </h3>
              {d.timeseries.requests_1h.length >= 1 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={d.timeseries.requests_1h}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
                    <XAxis dataKey="t" tickFormatter={formatTime} stroke="var(--hairline)" tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} />
                    <YAxis stroke="var(--hairline)" tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--hairline)', color: 'var(--foreground)', borderRadius: 6, fontSize: 12 }} labelFormatter={(l: unknown) => formatTime(Number(l))} />
                    <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'monospace' }} formatter={(v: string) => <span style={{ color: 'var(--ink)' }}>{v}</span>} />
                    <Bar dataKey="count" fill="var(--ink-soft)" radius={[2, 2, 0, 0]} name="Requests" />
                    <Bar dataKey="errors" fill="var(--destructive)" radius={[2, 2, 0, 0]} name="Errors" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-ink-soft font-mono text-sm">Collecting data. (requests in last 1h will appear here)</div>
              )}
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            <div className="p-5 rounded-md border border-hairline bg-card">
              <h3 className="eyebrow mb-4">Daily Chat Budget</h3>
              <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all duration-500 ${budgetPct > 80 ? 'bg-red-400' : budgetPct > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(100, budgetPct)}%` }} />
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-ink-soft">Used: {d.chat_metrics.budget_used}</span>
                <span className={budgetPct > 80 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}>Remaining: {d.chat_metrics.budget_remaining}</span>
              </div>
            </div>
            <div className="p-5 rounded-md border border-hairline bg-card">
              <h3 className="eyebrow mb-4 flex items-center gap-2"><Wifi className="size-3.5 text-brand-text" /> Chat Metrics</h3>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex justify-between"><span className="text-ink-soft">Conversations</span><span>{d.chat_metrics.conversations_24h}</span></div>
                <div className="flex justify-between"><span className="text-ink-soft">Avg Inference</span><span>{d.chat_metrics.avg_inference_ms}ms</span></div>
                <div className="flex justify-between"><span className="text-ink-soft">Cache Hit Rate</span><span className="text-brand-text">{d.chat_metrics.cache_hit_rate}%</span></div>
                <div className="flex justify-between"><span className="text-ink-soft">Rate Limits</span><span className={d.chat_metrics.rate_limit_hits_24h > 0 ? 'text-amber-700 dark:text-amber-400' : ''}>{d.chat_metrics.rate_limit_hits_24h}</span></div>
              </div>
            </div>
            <div className="p-5 rounded-md border border-hairline bg-card">
              <h3 className="eyebrow mb-4 flex items-center gap-2"><Database className="size-3.5 text-brand-text" /> Infrastructure</h3>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex justify-between"><span className="text-ink-soft">Runtime</span><span>{d.infrastructure.node_version}</span></div>
                <div className="flex justify-between"><span className="text-ink-soft">Uptime</span><span>{formatUptime(d.infrastructure.uptime_seconds)}</span></div>
                <div className="flex justify-between"><span className="text-ink-soft">Cold Starts</span><span>{d.infrastructure.cold_starts}</span></div>
                <div className="flex justify-between"><span className="text-ink-soft">Boot</span><span className="text-xs">{new Date(d.infrastructure.boot_time).toLocaleTimeString()}</span></div>
              </div>
            </div>
          </section>
        </>
      )}

      {(d.recent_errors ?? []).length > 0 && (
        <section>
          <h3 className="eyebrow mb-4 flex items-center gap-2">
            <AlertTriangle className="size-3.5 text-red-700 dark:text-red-400" /> Recent Errors
          </h3>
          <div className="rounded-md border border-red-400/20 bg-card overflow-hidden">
            <div className="divide-y divide-hairline">
              {(d.recent_errors ?? []).slice(0, compact ? 5 : 10).map((err, i) => (
                <RecentErrorRow key={i} error={err} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section>
        <h3 className="eyebrow mb-4 flex items-center gap-2">
          <Radio className="size-3.5 text-emerald-700 dark:text-emerald-400" /> Recent Events
        </h3>
        <div className="rounded-md border border-hairline bg-card overflow-hidden">
          {d.recent_events.length === 0 ? (
            <div className="p-6 text-center text-ink-soft font-mono text-sm">No events recorded yet</div>
          ) : (
            <div className="divide-y divide-hairline">
              {d.recent_events.slice(0, compact ? 8 : 15).map((ev, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <span className="text-xs font-mono text-ink-soft min-w-[80px]">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  <span className="text-xs font-mono text-ink-soft min-w-[80px] uppercase">{ev.type}</span>
                  <span className="text-sm text-foreground truncate">{ev.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
