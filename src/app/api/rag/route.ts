import { NextRequest, NextResponse } from "next/server";
import { retrieveContext } from "@/lib/rag";
import { sanitizeInput } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { query?: unknown; topK?: unknown };
    const query = typeof body.query === "string" ? body.query : "";
    const requestedTopK = typeof body.topK === "number" ? body.topK : 5;
    const topK = Math.max(1, Math.min(8, Math.trunc(requestedTopK)));

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const inputCheck = sanitizeInput(query);
    if (!inputCheck.safe || !inputCheck.sanitized) {
      return NextResponse.json(
        { error: "Query rejected", message: inputCheck.reason || "Unsafe query." },
        { status: 400 }
      );
    }

    const context = await retrieveContext(inputCheck.sanitized, topK);
    return NextResponse.json({
      context,
      source: "local_knowledge_base",
      top_k: topK,
    });
  } catch (error) {
    console.error("RAG API error:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
