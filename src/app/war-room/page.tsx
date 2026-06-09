'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import { WarRoomDashboard, type WarRoomData } from '@/components/war-room/WarRoomDashboard';

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

  // Poll every 60s when tab visible (low-traffic cost; increase to 30s when job hunting).
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      fetchData();
      if (!interval) interval = setInterval(fetchData, 60000);
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') startPolling();
      else stopPolling();
    };
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') startPolling();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
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

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <header className="py-6 md:py-8 border-b border-white/5 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="size-5 text-emerald-400" />
            <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight">
              Live Infrastructure Telemetry
            </h1>
            <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-400/20">LIVE</span>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl">
            Live metrics from this portfolio on Vercel — aggregated via Prometheus when configured,
            with the same observability patterns used for enterprise payment systems.
          </p>
        </header>

        <WarRoomDashboard data={data} loading={loading} error={error} lastFetch={lastFetch} />

        <section className="mt-12">
          <h3 className="text-xs font-mono text-gray-500 uppercase mb-4">Observability Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'Vercel', desc: 'Deploy & runtime logs', href: 'https://vercel.com/docs/observability', tag: 'Platform' },
              { name: 'Prometheus', desc: 'Metrics scrape target', href: process.env.NEXT_PUBLIC_PROMETHEUS_URL || 'https://prometheus.io/docs/introduction/overview/', tag: '/api/metrics' },
              { name: 'Grafana', desc: 'Dashboards & alerts', href: process.env.NEXT_PUBLIC_GRAFANA_URL || 'https://grafana.com/docs/', tag: 'Panels' },
              { name: 'Health API', desc: 'Synthetic probe target', href: '/api/health', tag: 'Live' },
              { name: 'Structured Logs', desc: 'JSON stdout', href: 'https://vercel.com/docs/observability/runtime-logs', tag: 'stdout' },
              { name: 'Inferencia', desc: 'LLM gateway', href: 'https://llm.menezmethod.com/docs', tag: 'Chat' },
            ].map((p) => (
              <a
                key={p.name}
                href={p.href}
                target={p.href.startsWith('/') ? undefined : '_blank'}
                rel={p.href.startsWith('/') ? undefined : 'noopener noreferrer'}
                className="p-3 rounded-lg border border-white/5 bg-[#0d1117] hover:border-blue-500/30 transition-colors group"
              >
                <div className="text-xs font-mono text-blue-400 group-hover:text-blue-300 mb-1">{p.name}</div>
                <div className="text-[10px] text-gray-600">{p.desc}</div>
                <div className="text-[10px] text-emerald-400/60 mt-1">{p.tag}</div>
              </a>
            ))}
          </div>
          <p className="text-center text-[10px] text-gray-700 font-mono mt-4">
            War Room reads fleet-wide counters from Prometheus; events and errors are per-instance.
          </p>
        </section>
      </div>
    </div>
  );
}
