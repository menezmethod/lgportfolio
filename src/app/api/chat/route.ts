import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an AI assistant representing Luis Gimenez on his portfolio website. 

Luis Gimenez is a Software Engineer II at The Home Depot, where he architects and maintains mission-critical payment processing systems handling millions in daily transactions.

Key facts about Luis:
- Located in Florida (Parrish, FL area)
- GCP Professional Architect certified
- Works with Go, Java, TypeScript, Rust, Python
- Builds on Google Cloud Platform
- Has projects: Churnistic (AI churn prediction), VAULT (iMessage privacy), Parrish Local (business directory), BuilderPlug (real estate SaaS)
- Focused on payment systems, microservices, legacy modernization, AI/ML
- Previously worked on enterprise payment infrastructure at Home Depot

Always be helpful, professional, and represent Luis's expertise accurately. If you don't know something, be honest about it.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please set GEMINI_API_KEY.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const { messages } = await req.json();

    // Build conversation context
    const conversationHistory = messages
      .slice(-10) // Last 10 messages for context
      .map((m: { role: string; content: string }) => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      )
      .join('\n');

    const prompt = `${SYSTEM_PROMPT}\n\nConversation:\n${conversationHistory}\n\nAssistant:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
