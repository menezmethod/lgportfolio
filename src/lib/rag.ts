import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_QUERY",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding?.values || [];
}


// Import our file-based context
import { KNOWLEDGE_BASE } from "./knowledge";

export async function retrieveContext(query: string, topK = 5): Promise<string> {
  // If no Supabase (or just for testing), use our local file first
  if (!supabase) {
    console.log("Using local file-based knowledge base (Supabase not configured)");
    return KNOWLEDGE_BASE;
  }

  try {
    const embedding = await generateEmbedding(query);

    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: topK,
    });

    // If RAG returns nothing, fallback to our full knowledge base
    if (error || !data || data.length === 0) {
      console.log("RAG query returned no matches, falling back to full knowledge base.");
      return KNOWLEDGE_BASE;
    }

    return data
      .map(
        (doc: { content: string; metadata: { source: string } }) =>
          `[Source: ${doc.metadata?.source || "unknown"}] ${doc.content}`
      )
      .join("\n\n---\n\n");
  } catch (err) {
    console.error("RAG retrieval error:", err);
    // On error, always fallback to the file
    return KNOWLEDGE_BASE;
  }
}
