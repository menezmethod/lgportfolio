import { NextRequest, NextResponse } from 'next/server';
import { recordRequest } from '@/lib/telemetry';
import { retrieveContext } from '@/lib/rag';

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

    const context = await retrieveContext(query, 5);
    const source = process.env.CLOUD_SQL_CONNECTION_NAME ? 'cloudsql' : 'fallback';

    recordRequest("/api/rag", "POST", 200, Date.now() - start);
    return NextResponse.json({ context, source });
  } catch (error) {
    console.error('RAG API error:', error);
    recordRequest("/api/rag", "POST", 500, Date.now() - start);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}
