'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { incrementSessionMessageCount, isSessionLimitReached, getSessionMessageCount } from '@/lib/rate-limit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMarkdown } from '@/components/chat-markdown';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Tell me about Luis's background",
  "What GCP services has Luis used?",
  "Describe the Churnistic project",
  "What's Luis's tech stack?",
  "Is Luis open to remote roles?",
];

function cleanAssistantContent(raw: string): string {
  if (!raw?.trim()) return raw;
  let out = raw.trim();

  // Explicit [Answer] marker — keep only what's after the last one
  const answerMarker = /\[\s*\*\*\s*Answer\s*\*\*\s*\]|\[\s*Answer\s*\]/i;
  if (answerMarker.test(out)) {
    const parts = out.split(answerMarker);
    const after = parts[parts.length - 1]?.trim();
    if (after) return after;
  }

  // Separator **---** or \n---\n — keep only what's after the last separator
  const sep = /\*\*\s*---\s*\*\*|\n\s*---\s*\n/;
  if (sep.test(out)) {
    const parts = out.split(sep);
    const last = parts[parts.length - 1]?.trim();
    if (last) return last;
  }

  // [Reasoning] or **[Reasoning]** (asterisks inside or outside brackets) — strip reasoning block, keep the rest
  const reasoningStart = /^\s*(\*\*)?\s*\[\s*(?:\*\*)?\s*Reasoning\s*(?:\*\*)?\s*\]\s*(\*\*)?\s*\n*/i;
  if (reasoningStart.test(out)) {
    out = out.replace(reasoningStart, '');
    // Also strip content up to (and including) **---** or **[Answer]** if present
    const sepOrAnswer = /\n?\s*\*\*\s*---\s*\*\*|\n\s*---\s*\n|\[\s*(?:\*\*)?\s*Answer\s*(?:\*\*)?\s*\]/i;
    const idx = out.search(sepOrAnswer);
    if (idx !== -1) {
      const afterSep = out.slice(idx).replace(sepOrAnswer, '').trim();
      if (afterSep) return afterSep;
    }
    return out.trim();
  }

  // Anywhere in text: [Reasoning]...---... or ...[Answer]... — take part after last separator/answer
  const reasoningMarker = /\[\s*(?:\*\*)?\s*Reasoning\s*(?:\*\*)?\s*\]/i;
  if (reasoningMarker.test(out) && sep.test(out)) {
    const parts = out.split(sep);
    const last = parts[parts.length - 1]?.trim();
    if (last) return last;
  }
  if (reasoningMarker.test(out)) {
    // Has [Reasoning] but no separator — drop lines until we're past the reasoning header
    const lines = out.split('\n');
    const startIdx = lines.findIndex((l) => /Reasoning/i.test(l));
    if (startIdx !== -1 && startIdx + 1 < lines.length) {
      return lines.slice(startIdx + 1).join('\n').trim();
    }
    return '';
  }

  return out;
}

/** Strip leading markdown artifacts from fallback model (e.g. stray ** at start). */
function normalizeAssistantContent(text: string): string {
  if (!text?.trim()) return text;
  let out = text.trim();
  // Remove leading ** or * (common fallback model artifact)
  out = out.replace(/^\s*\*{1,2}(?:\s*\n?|\s+)/, '');
  // Remove leading __ (underscore bold artifact)
  out = out.replace(/^\s*_{1,2}(?:\s*\n?|\s+)/, '');
  return out.trim();
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Luis's AI assistant. I can answer questions about his GCP architecture experience, payment systems expertise, and technical skills.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const [sessionMessageCount, setSessionMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSessionLimitReached()) setShowLimitMessage(true);
  }, []);

  useEffect(() => {
    setSessionMessageCount(getSessionMessageCount());
  }, [messages]);

  // Create a ref to track if the user has scrolled up
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Auto-scroll to bottom only when a new message starts or finishes, or loading state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || showLimitMessage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/plain')) {
        const text = await response.text();
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'assistant', content: normalizeAssistantContent(cleanAssistantContent(text) || text) },
        ]);
      } else {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');
        
        const decoder = new TextDecoder();
        let assistantContent = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const decoded = decoder.decode(value, { stream: true });
          const lines = decoded.split('\n');
          let hadDataStreamLine = false;
          
          for (const line of lines) {
            if (line.startsWith('0:')) {
              hadDataStreamLine = true;
              try {
                const data = JSON.parse(line.substring(2));
                if (data.text) {
                  assistantContent += data.text;
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === 'assistant') last.content = assistantContent;
                    else next.push({ id: Date.now().toString(), role: 'assistant', content: assistantContent });
                    return next;
                  });
                }
              } catch {}
            }
          }
          if (!hadDataStreamLine && decoded.trim()) {
            assistantContent += decoded;
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === 'assistant') last.content = assistantContent;
              else next.push({ id: Date.now().toString(), role: 'assistant', content: assistantContent });
              return next;
            });
          }
        }
      }

      incrementSessionMessageCount();
      if (isSessionLimitReached()) setShowLimitMessage(true);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background pt-[60px] sm:pt-[64px]">
      {/* Container widened to max-w-[95%] for "full width" feel while keeping some margins */}
      <div className="mx-auto flex h-full w-full max-w-[95%] xl:max-w-[1800px] flex-col gap-4 px-2 pb-4 sm:px-4 md:px-6">
        
        {/* Header Section */}
        <header className="shrink-0 py-2 sm:py-4 flex flex-col items-center text-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            <span>Interactive Portfolio Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            Ask the AI Assistant
          </h1>
        </header>

        {/* Main Chat Area */}
        <Card className="flex flex-1 flex-col overflow-hidden border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl relative w-full">
          
          {/* Scroll Area */}
          <ScrollArea className="flex-1 w-full" type="always">
            <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 min-h-full w-full">
              
              {/* Introduction / Empty State Hints */}
              {messages.length === 0 && (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                    <Bot className="size-16 mb-4 text-primary/50" />
                    <p className="text-muted-foreground text-lg">Start a conversation to learn more about Luis.</p>
                 </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-4 max-w-5xl animate-fadeIn w-full',
                    message.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "size-8 sm:size-10 shrink-0 rounded-full flex items-center justify-center border shadow-sm mt-1",
                    message.role === 'assistant' 
                      ? "bg-primary/10 border-primary/20 text-primary" 
                      : "bg-secondary/10 border-secondary/20 text-secondary"
                  )}>
                    {message.role === 'assistant' ? <Bot className="size-5" /> : <User className="size-5" />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={cn(
                      'rounded-2xl px-5 py-3.5 sm:px-6 sm:py-4 shadow-sm text-sm sm:text-base leading-relaxed max-w-full overflow-x-auto',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted/50 border border-border/50 backdrop-blur-sm text-foreground rounded-tl-sm w-full'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <ChatMarkdown content={normalizeAssistantContent(cleanAssistantContent(message.content))} />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 max-w-5xl">
                  <div className="size-8 sm:size-10 shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mt-1">
                     <Bot className="size-5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-6 py-4 bg-muted/40 border border-border/50 backdrop-blur-sm flex items-center gap-3">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-px w-px" />
            </div>
          </ScrollArea>

          {/* Floating Controls Layer */}
          <div className="p-4 sm:p-5 bg-gradient-to-t from-background via-background/95 to-transparent pt-10">
            
            {/* Suggested Prompts */}
            {!showLimitMessage && messages.length <= 1 && (
              <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide mask-fade-sides justify-start sm:justify-center">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-full border-border/60 bg-background/50 backdrop-blur hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300"
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 p-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-lg w-full max-w-4xl mx-auto"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about my experience, skills, or projects..."
                className="flex-1 bg-transparent border-0 focus-visible:ring-0 px-4 py-3 h-auto text-base placeholder:text-muted-foreground/50"
                disabled={isLoading || showLimitMessage}
              />
              <Button
                type="submit"
                size="icon"
                className={cn(
                  "size-10 rounded-lg transition-all duration-300", 
                  input.trim() ? "bg-primary text-primary-foreground shadow-glow-primary" : "bg-muted text-muted-foreground opacity-50"
                )}
                disabled={!input.trim() || isLoading || showLimitMessage}
              >
                <Send className="size-5" />
              </Button>
            </form>
            
            {/* Footer Limit Info */}
            {!showLimitMessage && (
               <div className="text-center mt-2.5">
                  <span className="text-[10px] text-muted-foreground/40 font-mono">
                     {sessionMessageCount}/20 queries remaining
                  </span>
               </div>
            )}

            {showLimitMessage && (
                <div className="mt-3 p-3 rounded-lg border border-secondary/30 bg-secondary/5 text-center">
                    <p className="text-secondary text-sm font-medium mb-1">Session limit reached</p>
                    <a href="mailto:luisgimenezdev@gmail.com" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                        Contact Luis directly <ExternalLink className="size-3" />
                    </a>
                </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
