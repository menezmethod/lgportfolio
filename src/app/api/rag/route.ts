import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client for RAG
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Portfolio content for RAG (fallback when Supabase not configured)
const PORTFOLIO_CONTEXT = `
Luis Gimenez - Professional Profile

EXPERIENCE:
- Software Engineer II at The Home Depot
- Architecting mission-critical payment processing systems
- Handling millions in daily transactions
- Working with Go, Java, TypeScript on Google Cloud Platform
- GCP Professional Architect certified

PROJECTS:
1. Churnistic - AI-powered customer churn prediction platform
2. VAULT - Privacy-first iMessage automation system
3. Parrish Local - Local business directory
4. BuilderPlug - SaaS for real estate professionals

SKILLS:
- Languages: Go, Java, TypeScript, Rust, Python, JavaScript
- Cloud: Google Cloud Platform, GCP, Cloud Run, GKE, BigQuery
- Frameworks: React, Next.js, Node.js, Spring Boot
- Tools: Docker, Kubernetes, Terraform, Git, CI/CD
- Domains: Payment Systems, Microservices, System Architecture

EDUCATION:
- Bachelor's in Computer Science (implied from software engineering career)

LOCATION:
- Parrish, Florida area

CONTACT:
- Email: luisgimenezdev@gmail.com
- GitHub: @menezmethod
- LinkedIn: linkedin.com/in/gimenezdev
- Twitter: @menezmethod
`;

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // If Supabase is configured, try RAG
    if (supabase) {
      try {
        // For now, we'll do a simple similarity search on text
        // In production, you'd use embeddings and pgvector
        const { data, error } = await supabase
          .from('portfolio_embeddings')
          .select('content, metadata')
          .textSearch('content', query)
          .limit(3);

        if (!error && data && data.length > 0) {
          const context = data.map((d) => d.content).join('\n');
          return NextResponse.json({ context, source: 'supabase' });
        }
      } catch (ragError) {
        console.warn('RAG lookup failed, using fallback:', ragError);
      }
    }

    // Fallback: return static portfolio context
    return NextResponse.json({ 
      context: PORTFOLIO_CONTEXT, 
      source: 'fallback' 
    });
  } catch (error) {
    console.error('RAG API error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}
