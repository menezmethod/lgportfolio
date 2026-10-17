'use client';

import { useEffect, useState, useCallback } from 'react';
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

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <header className="mb-8 border-b border-hairline py-10 sm:py-14">
          <p className="eyebrow">War room / Live</p>
          <h1 className="mt-5 text-[clamp(40px,7vw,88px)] font-medium leading-[1.02] tracking-[-0.045em]">
            Telemetry from this site.
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-soft">
            Live metrics from this site, deployed with Coolify on a free-tier cloud VM. The numbers come from in-app telemetry, or from Prometheus when one is configured, and the source badge below says which. In-memory counters reset when the app restarts.
          </p>
        </header>

        <WarRoomDashboard data={data} loading={loading} error={error} lastFetch={lastFetch} />

        <section className="mt-12">
          <h2 className="eyebrow mb-4">Observability stack</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {[
              { name: 'Coolify', desc: 'Deploy and container runtime', href: 'https://coolify.io/docs', tag: 'Platform' },
              { name: 'Prometheus', desc: 'Text exposition endpoint', href: 'https://prometheus.io/docs/instrumenting/exposition_formats/', tag: '/api/metrics' },
              { name: 'Vectorize', desc: 'RAG retrieval index', href: 'https://developers.cloudflare.com/vectorize/', tag: 'Cloudflare' },
              { name: 'Health API', desc: 'Synthetic probe target', href: '/api/health', tag: 'Live' },
              { name: 'Structured logs', desc: 'JSON stdout', href: 'https://coolify.io/docs/knowledge-base/docker/logs', tag: 'stdout' },
              { name: 'Workers AI', desc: 'Chat generation', href: 'https://developers.cloudflare.com/workers-ai/', tag: 'Cloudflare' },
            ].map((p) => (
              <a
                key={p.name}
                href={p.href}
                target={p.href.startsWith('/') ? undefined : '_blank'}
                rel={p.href.startsWith('/') ? undefined : 'noopener noreferrer'}
                className="group min-h-11 rounded-md border border-hairline bg-card p-3 transition-colors hover:border-foreground"
              >
                <div className="mb-1 font-mono text-xs text-brand-text">{p.name}</div>
                <div className="text-xs text-ink-soft">{p.desc}</div>
                <div className="mt-1 font-mono text-xs text-ink-soft">{p.tag}</div>
              </a>
            ))}
          </div>
          <p className="mt-4 text-center font-mono text-xs text-ink-soft">
            Events and errors are in memory on the serving container.
          </p>
        </section>
      </div>
    </div>
  );
}
