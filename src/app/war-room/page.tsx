'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, Cpu, Zap, Shield, Database, Radio, Clock, AlertTriangle, Loader2, BarChart3, Wifi } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface WarRoomData {
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
  recent_events: Array<{ timestamp: string; type: string; message: string }>;
  timeseries: {
    latency_1h: Array<{ t: number; p50: number; p95: number }>;
    requests_1h: Array<{ t: number; count: number; errors: number }>;
  };
}

const STATUS_COLORS: Record<string, string> = {
  up: 'text-emerald-400',
  healthy: 'text-emerald-400',
  degraded: 'text-amber-400',
  down: 'text-red-400',
  unhealthy: 'text-red-400',
};

const STATUS_BG: Record<string, string> = {
  up: 'bg-emerald-400/10 border-emerald-400/30',
  healthy: 'bg-emerald-400/10 border-emerald-400/30',
  degraded: 'bg-amber-400/10 border-amber-400/30',
  down: 'bg-red-400/10 border-red-400/30',
  unhealthy: 'bg-red-400/10 border-red-400/30',
};

const EVENT_ICONS: Record<string, string> = {
  deploy: '🚀', error: '❌', scale: '📈', rate_limit: '🛑',
  cold_start: '❄️', health: '✅', cache_hit: '⚡',
};

function StatusDot({ status }: { status: string }) {
  const color = status === 'up' || status === 'healthy' ? 'bg-emerald-400' : status === 'degraded' ? 'bg-amber-400' : 'bg-red-400';
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
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

function labelFormatter(label: unknown): string {
  return formatTime(Number(label));
}

export default function WarRoom() {
  const [data, setData] = useState<WarRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/war-room/data', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
      setLastFetch(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center pt-16">
        <div className="flex items-center gap-3 text-muted-foreground font-mono">
          <Loader2 className="size-5 animate-spin" />
          <span>Initializing telemetry...</span>
        </div>
      </div>
    );
  }

  const d = data!;
  const checks = d.service_status.checks;
  const budgetMax = d.chat_metrics.budget_used + d.chat_metrics.budget_remaining;
  const budgetPct = budgetMax > 0 ? (d.chat_metrics.budget_used / budgetMax) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* ── BANNER ── */}
        <header className="py-6 md:py-8 border-b border-white/5 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Activity className="size-5 text-emerald-400" />
                <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight">
                  Live Infrastructure Telemetry
                </h1>
                <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-400/20">LIVE</span>
              </div>
              <p className="text-sm text-gray-500 max-w-2xl">
                Real operational data from this portfolio&apos;s GCP infrastructure, instrumented with the same
                observability patterns used for enterprise payment systems.
              </p>
            </div>
            <div className="text-xs font-mono text-gray-600 text-right">
              <div>Last refresh: {lastFetch || '—'}</div>
              <div>Region: {d.service_status.region}</div>
              <div>v{d.service_status.version}</div>
            </div>
          </div>
          {error && (
            <div className="mt-3 p-2 bg-red-400/10 border border-red-400/20 rounded text-red-400 text-xs font-mono">
              Fetch error: {error}
            </div>
          )}
        </header>

        {/* ── ROW 1: STATUS TILES ── */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <div className={`p-4 rounded-lg border ${STATUS_BG[d.service_status.status]} flex flex-col gap-2`}>
            <div className="flex items-center gap-2">
              <StatusDot status={d.service_status.status} />
              <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Overall</span>
            </div>
            <span className={`text-lg font-bold font-mono ${STATUS_COLORS[d.service_status.status]}`}>
              {d.service_status.status.toUpperCase()}
            </span>
          </div>
          {Object.entries(checks).map(([name, check]) => (
            <div key={name} className={`p-4 rounded-lg border ${STATUS_BG[check.status]} flex flex-col gap-2`}>
              <div className="flex items-center gap-2">
                <StatusDot status={check.status} />
                <span className="text-xs font-mono uppercase tracking-wider text-gray-400 truncate">{name.replace(/_/g, ' ')}</span>
              </div>
              <span className={`text-sm font-mono ${STATUS_COLORS[check.status]}`}>
                {check.status.toUpperCase()}
                {check.latency_ms != null && check.latency_ms > 0 && <span className="text-gray-500 ml-1">{check.latency_ms}ms</span>}
              </span>
            </div>
          ))}
        </section>

        {/* ── ROW 2: KEY METRICS ── */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Uptime', value: formatUptime(d.infrastructure.uptime_seconds), icon: Clock, color: 'text-emerald-400' },
            { label: 'Requests', value: d.request_metrics.total_24h.toLocaleString(), icon: BarChart3, color: 'text-blue-400' },
            { label: 'P95 Latency', value: `${d.request_metrics.latency_p95}ms`, icon: Zap, color: 'text-amber-400' },
            { label: 'Error Rate', value: `${d.request_metrics.error_rate_1h.toFixed(1)}%`, icon: AlertTriangle, color: d.request_metrics.error_rate_1h > 5 ? 'text-red-400' : 'text-emerald-400' },
            { label: 'Cache Hit', value: `${d.chat_metrics.cache_hit_rate}%`, icon: Cpu, color: 'text-purple-400' },
            { label: 'Budget Left', value: d.chat_metrics.budget_remaining.toString(), icon: Shield, color: d.chat_metrics.budget_remaining < 20 ? 'text-red-400' : 'text-emerald-400' },
          ].map((m) => (
            <div key={m.label} className="p-4 rounded-lg border border-white/5 bg-[#161b22] flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <m.icon className={`size-4 ${m.color}`} />
                <span className="text-xs font-mono text-gray-500 uppercase">{m.label}</span>
              </div>
              <span className={`text-2xl md:text-3xl font-bold font-mono ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </section>

        {/* ── ROW 3: TIME SERIES CHARTS ── */}
        <section className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-lg border border-white/5 bg-[#161b22]">
            <h3 className="text-xs font-mono text-gray-500 uppercase mb-4 flex items-center gap-2">
              <Zap className="size-3.5 text-amber-400" /> Request Latency (1h)
            </h3>
            {d.timeseries.latency_1h.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={d.timeseries.latency_1h}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2633" />
                  <XAxis dataKey="t" tickFormatter={formatTime} stroke="#4b5563" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#4b5563" tick={{ fontSize: 10 }} unit="ms" />
                  <Tooltip
                    contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 }}
                    labelFormatter={labelFormatter}
                  />
                  <Line type="monotone" dataKey="p50" stroke="#22c55e" strokeWidth={2} dot={false} name="P50" />
                  <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} dot={false} name="P95" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-600 font-mono text-sm">
                Collecting data... ({d.timeseries.latency_1h.length} points)
              </div>
            )}
          </div>

          <div className="p-5 rounded-lg border border-white/5 bg-[#161b22]">
            <h3 className="text-xs font-mono text-gray-500 uppercase mb-4 flex items-center gap-2">
              <BarChart3 className="size-3.5 text-blue-400" /> Requests per 10s (1h)
            </h3>
            {d.timeseries.requests_1h.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.timeseries.requests_1h}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2633" />
                  <XAxis dataKey="t" tickFormatter={formatTime} stroke="#4b5563" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#4b5563" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 }}
                    labelFormatter={labelFormatter}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Requests" />
                  <Bar dataKey="errors" fill="#ef4444" radius={[2, 2, 0, 0]} name="Errors" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-600 font-mono text-sm">
                Collecting data... ({d.timeseries.requests_1h.length} points)
              </div>
            )}
          </div>
        </section>

        {/* ── ROW 4: GAUGES & DETAILS ── */}
        <section className="grid md:grid-cols-3 gap-4 mb-8">
          {/* Budget Gauge */}
          <div className="p-5 rounded-lg border border-white/5 bg-[#161b22]">
            <h3 className="text-xs font-mono text-gray-500 uppercase mb-4">Daily Chat Budget</h3>
            <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${budgetPct > 80 ? 'bg-red-400' : budgetPct > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(100, budgetPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-500">Used: {d.chat_metrics.budget_used}</span>
              <span className={budgetPct > 80 ? 'text-red-400' : 'text-emerald-400'}>
                Remaining: {d.chat_metrics.budget_remaining}
              </span>
            </div>
          </div>

          {/* Chat Stats */}
          <div className="p-5 rounded-lg border border-white/5 bg-[#161b22]">
            <h3 className="text-xs font-mono text-gray-500 uppercase mb-4 flex items-center gap-2">
              <Wifi className="size-3.5 text-purple-400" /> Chat Metrics
            </h3>
            <div className="space-y-3 text-sm font-mono">
              <div className="flex justify-between"><span className="text-gray-500">Conversations</span><span>{d.chat_metrics.conversations_24h}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Avg Inference</span><span>{d.chat_metrics.avg_inference_ms}ms</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cache Hit Rate</span><span className="text-purple-400">{d.chat_metrics.cache_hit_rate}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Rate Limits</span><span className={d.chat_metrics.rate_limit_hits_24h > 0 ? 'text-amber-400' : ''}>{d.chat_metrics.rate_limit_hits_24h}</span></div>
            </div>
          </div>

          {/* Infrastructure */}
          <div className="p-5 rounded-lg border border-white/5 bg-[#161b22]">
            <h3 className="text-xs font-mono text-gray-500 uppercase mb-4 flex items-center gap-2">
              <Database className="size-3.5 text-blue-400" /> Infrastructure
            </h3>
            <div className="space-y-3 text-sm font-mono">
              <div className="flex justify-between"><span className="text-gray-500">Runtime</span><span>{d.infrastructure.node_version}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Uptime</span><span>{formatUptime(d.infrastructure.uptime_seconds)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cold Starts</span><span>{d.infrastructure.cold_starts}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Boot</span><span className="text-xs">{new Date(d.infrastructure.boot_time).toLocaleTimeString()}</span></div>
            </div>
          </div>
        </section>

        {/* ── ROW 5: RECENT EVENTS ── */}
        <section className="mb-8">
          <h3 className="text-xs font-mono text-gray-500 uppercase mb-4 flex items-center gap-2">
            <Radio className="size-3.5 text-emerald-400" /> Recent Events
          </h3>
          <div className="rounded-lg border border-white/5 bg-[#161b22] overflow-hidden">
            {d.recent_events.length === 0 ? (
              <div className="p-6 text-center text-gray-600 font-mono text-sm">No events recorded yet</div>
            ) : (
              <div className="divide-y divide-white/5">
                {d.recent_events.slice(0, 15).map((ev, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    <span className="text-xs font-mono text-gray-600 min-w-[80px]">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-base min-w-[24px]">{EVENT_ICONS[ev.type] || '📋'}</span>
                    <span className="text-xs font-mono text-gray-500 min-w-[80px] uppercase">{ev.type}</span>
                    <span className="text-sm text-gray-300 truncate">{ev.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── ROW 6: GCP PRODUCTS ── */}
        <section>
          <h3 className="text-xs font-mono text-gray-500 uppercase mb-4">Observability Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'Cloud Logging', desc: 'Structured logs', href: 'https://cloud.google.com/logging', free: '50 GB/mo' },
              { name: 'Cloud Trace', desc: 'Distributed tracing', href: 'https://cloud.google.com/trace', free: '2.5M spans/mo' },
              { name: 'Cloud Monitoring', desc: 'Metrics & alerts', href: 'https://cloud.google.com/monitoring', free: 'Free tier' },
              { name: 'Uptime Checks', desc: 'Endpoint monitoring', href: 'https://cloud.google.com/monitoring/uptime-checks', free: '100 checks' },
              { name: 'Error Reporting', desc: 'Exception tracking', href: 'https://cloud.google.com/error-reporting', free: 'Free' },
              { name: 'Cloud Armor', desc: 'WAF & DDoS', href: 'https://cloud.google.com/armor', free: 'Standard tier' },
            ].map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg border border-white/5 bg-[#0d1117] hover:border-blue-500/30 transition-colors group"
              >
                <div className="text-xs font-mono text-blue-400 group-hover:text-blue-300 mb-1">{p.name}</div>
                <div className="text-[10px] text-gray-600">{p.desc}</div>
                <div className="text-[10px] text-emerald-400/60 mt-1">{p.free}</div>
              </a>
            ))}
          </div>
          <p className="text-center text-[10px] text-gray-700 font-mono mt-4">
            All running on GCP free tier. Additional cost: ~$0/month for observability.
          </p>
        </section>
      </div>
    </div>
  );
}
