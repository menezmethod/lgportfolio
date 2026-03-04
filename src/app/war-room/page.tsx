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

  // Poll only when tab is visible to limit abuse from many open-but-background tabs.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      fetchData();
      if (!interval) interval = setInterval(fetchData, 10000);
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
            Real operational data from this portfolio&apos;s GCP infrastructure, instrumented with the same
            observability patterns used for enterprise payment systems.
          </p>
        </header>

        <WarRoomDashboard data={data} loading={loading} error={error} lastFetch={lastFetch} />

        <section className="mt-12">
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
