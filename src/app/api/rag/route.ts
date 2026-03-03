import { NextRequest, NextResponse } from 'next/server';
import { recordRequest } from '@/lib/telemetry';
import { retrieveContext } from '@/lib/rag';

// In-memory cache for RAG responses (free-tier: absorb duplicate queries when traffic spikes)
const RAG_CACHE_TTL_MS = 60_000; // 1 min
const ragCache = new Map<string, { body: string; cachedAt: number }>();
const RAG_CACHE_MAX_ENTRIES = 200;

function getRagCacheKey(query: string): string {
  return query.toLowerCase().trim().slice(0, 200);
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const { query } = await req.json();

    if (!query) {
      recordRequest("/api/rag", "POST", 400, Date.now() - start);
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const key = getRagCacheKey(query);
    const now = Date.now();
    const hit = ragCache.get(key);
    if (hit && now - hit.cachedAt < RAG_CACHE_TTL_MS) {
      recordRequest("/api/rag", "POST", 200, Date.now() - start);
      return new NextResponse(hit.body, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=60',
        },
      });
    }

    const context = await retrieveContext(query, 5);
    const source = process.env.CLOUD_SQL_CONNECTION_NAME ? 'cloudsql' : 'fallback';
    const body = JSON.stringify({ context, source });

    if (ragCache.size >= RAG_CACHE_MAX_ENTRIES) {
      const oldest = [...ragCache.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt)[0];
      if (oldest) ragCache.delete(oldest[0]);
    }
    ragCache.set(key, { body, cachedAt: now });

    recordRequest("/api/rag", "POST", 200, Date.now() - start);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    console.error('RAG API error:', error);
    recordRequest("/api/rag", "POST", 500, Date.now() - start);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}
