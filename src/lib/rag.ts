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

export async function retrieveContext(query: string, topK = 5): Promise<string> {
  if (!supabase) {
    return getStaticContext();
  }

  try {
    const embedding = await generateEmbedding(query);

    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: topK,
    });

    if (error || !data || data.length === 0) {
      return getStaticContext();
    }

    return data
      .map(
        (doc: { content: string; metadata: { source: string } }) =>
          `[Source: ${doc.metadata?.source || "unknown"}] ${doc.content}`
      )
      .join("\n\n---\n\n");
  } catch (err) {
    console.error("RAG retrieval error:", err);
    return getStaticContext();
  }
}

function getStaticContext(): string {
  return `
Luis Gimenez is a Software Engineer II at The Home Depot specializing in enterprise payment systems.

PROFESSIONAL EXPERIENCE:
- Software Engineer II, Payment Systems @ The Home Depot
- Architecting mission-critical payment processing systems handling millions in daily transactions
- Working with Go, Java, and Google Cloud Platform
- GCP Professional Cloud Architect certified

TECHNICAL SKILLS:
- Languages: Go, Java, TypeScript, Rust, Python
- Cloud: GCP (Cloud Run, GKE, BigQuery, Pub/Sub, Cloud CDN)
- Frameworks: React, Next.js, Node.js, Spring Boot
- Tools: Docker, Kubernetes, Terraform, Git, CI/CD
- Domains: Payment Systems, Microservices, System Architecture

PROJECTS:
- Churnistic: AI-powered customer churn prediction (TypeScript, Firebase, TensorFlow)
- Trading Journal: Real-time trading platform (React TS, Go gRPC, WebSockets)
- Rythmae: Audio engine (Rust, DSP)
- URL Shortener: High-throughput service (Go, Redis, Kubernetes)

CERTIFICATIONS:
- GCP Professional Cloud Architect

LOCATION: Parrish, Florida area

CONTACT: luisgimenezdev@gmail.com | github.com/menezmethod | linkedin.com/in/gimenezdev
`;
}
