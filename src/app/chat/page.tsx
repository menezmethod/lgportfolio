'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Terminal, Loader2, ExternalLink, Mail } from 'lucide-react';
import { incrementSessionMessageCount, isSessionLimitReached, getSessionMessageCount } from '@/lib/rate-limit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ChatMarkdown } from '@/components/chat-markdown';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  "What's Luis's experience with high-scale payment systems?",
  "How does Luis handle production incidents and on-call?",
  "What's his biggest technical contribution in the last year?",
  "Why is Luis looking for a new role?",
  "What does Luis bring to a senior or staff engineering team?",
];

function cleanAssistantContent(raw: string): string {
  if (!raw?.trim()) return raw;
  let out = raw.trim();

  const answerMarker = /\[\s*\*\*\s*Answer\s*\*\*\s*\]|\[\s*Answer\s*\]/i;
  if (answerMarker.test(out)) {
    const parts = out.split(answerMarker);
    const after = parts[parts.length - 1]?.trim();
    if (after) return after;
  }

  const sep = /\*\*\s*---\s*\*\*|\n\s*---\s*\n/;
  if (sep.test(out)) {
    const parts = out.split(sep);
    const last = parts[parts.length - 1]?.trim();
    if (last) return last;
  }

  const reasoningStart = /^\s*(\*\*)?\s*\[\s*(?:\*\*)?\s*Reasoning\s*(?:\*\*)?\s*\]\s*(\*\*)?\s*\n*/i;
  if (reasoningStart.test(out)) {
    out = out.replace(reasoningStart, '');
    const sepOrAnswer = /\n?\s*\*\*\s*---\s*\*\*|\n\s*---\s*\n|\[\s*(?:\*\*)?\s*Answer\s*(?:\*\*)?\s*\]/i;
    const idx = out.search(sepOrAnswer);
    if (idx !== -1) {
      const afterSep = out.slice(idx).replace(sepOrAnswer, '').trim();
      if (afterSep) return afterSep;
    }
    return out.trim();
  }

  const reasoningMarker = /\[\s*(?:\*\*)?\s*Reasoning\s*(?:\*\*)?\s*\]/i;
  if (reasoningMarker.test(out) && sep.test(out)) {
    const parts = out.split(sep);
    const last = parts[parts.length - 1]?.trim();
    if (last) return last;
  }
  if (reasoningMarker.test(out)) {
    const lines = out.split('\n');
    const startIdx = lines.findIndex((l) => /Reasoning/i.test(l));
    if (startIdx !== -1 && startIdx + 1 < lines.length) {
      return lines.slice(startIdx + 1).join('\n').trim();
    }
    return '';
  }

  return out;
}

function normalizeAssistantContent(text: string): string {
  if (!text?.trim()) return text;
  let out = text.trim();
  out = out.replace(/^\s*\*{1,2}(?:\s*\n?|\s+)/, '');
  out = out.replace(/^\s*_{1,2}(?:\s*\n?|\s+)/, '');
  return out.trim();
}

/** Remove duplicated block if the model repeated the same content twice (e.g. full answer copy-pasted). */
function dedupeRepeatedResponse(text: string): string {
  if (!text?.trim()) return text;
  let out = text.trim();
  // Strip trailing model artifacts (e.g. "GCP architectassistant")
  out = out.replace(/\s*\w*assistant\s*$/i, '').trim();
  if (out.length < 300) return out;
  const half = Math.floor(out.length / 2);
  const first = out.slice(0, half).trim();
  const second = out.slice(half).trim();
  if (first === second) return first;
  // Find a distinctive intro phrase that repeats and cut at second occurrence
  const intros = [
    'Luis brings a blend of hands-on reliability',
    'Luis has worked on several distributed-systems services',
    'Scale context: He operates within',
    'Key personal contributions',
  ];
  for (const intro of intros) {
    const idx = out.indexOf(intro);
    if (idx === -1) continue;
    const fromSecond = out.indexOf(intro, idx + 20);
    if (fromSecond > idx + 100) return out.slice(0, fromSecond).trim();
  }
  // Generic: if first 200 chars appear again later, cut there
  const head = out.slice(0, 200).trim();
  const headRepeat = out.indexOf(head, 250);
  if (headRepeat > 200) return out.slice(0, headRepeat).trim();
  return out;
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = sessionStorage.getItem('chatSessionId');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('chatSessionId', id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export default function Chat() {
  const sessionIdRef = useRef<string>('');
  if (!sessionIdRef.current) sessionIdRef.current = getOrCreateSessionId();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "I'm Luis's AI assistant. Ask me about his distributed systems architecture, GCP expertise, payment systems work, or edge AI projects.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const [sessionMessageCount, setSessionMessageCount] = useState(0);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSessionLimitReached()) setShowLimitMessage(true);
  }, []);

  useEffect(() => {
    setSessionMessageCount(getSessionMessageCount());
  }, [messages]);

  useEffect(() => {
    const el = messagesEndRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => cancelAnimationFrame(id);
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
          session_id: sessionIdRef.current,
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const apiMsg = (errBody as { message?: string })?.message;
        const msg =
          response.status === 429
            ? apiMsg || 'Rate limit reached. Wait a minute or email luisgimenezdev@gmail.com.'
            : response.status >= 500
              ? 'Server temporarily unavailable. Please try again in a moment.'
              : apiMsg || 'Something went wrong. Please try again.';
        throw new Error(msg);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/plain')) {
        const text = await response.text();
        const cleaned = dedupeRepeatedResponse(normalizeAssistantContent(cleanAssistantContent(text) || text));
        setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: cleaned }]);
      } else {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let assistantContent = '';
        let usedDataStream = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const decoded = decoder.decode(value, { stream: true });
          const lines = decoded.split('\n');
          let hadDataStreamLine = false;

          for (const line of lines) {
            if (line.startsWith('0:')) {
              hadDataStreamLine = true;
              usedDataStream = true;
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
              } catch { /* stream parse error */ }
            }
          }
          // Only append raw decoded if we never got "0:" lines (avoid duplicating when stream sends both)
          if (!usedDataStream && !hadDataStreamLine && decoded.trim()) {
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
        // Final cleanup so stored message has no [Reasoning] blocks or duplicates
        if (assistantContent) {
          const cleaned = dedupeRepeatedResponse(normalizeAssistantContent(cleanAssistantContent(assistantContent)) || assistantContent);
          if (cleaned !== assistantContent) {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === 'assistant') last.content = cleaned;
              return next;
            });
          }
        }
      }

      incrementSessionMessageCount();
      if (isSessionLimitReached()) setShowLimitMessage(true);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Service unavailable. Try again later.';
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content === errMsg) return prev;
        return [...prev, { id: Date.now().toString(), role: 'assistant', content: errMsg }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background pt-[60px] sm:pt-[64px]">
      <div className="mx-auto flex h-full w-full max-w-[95%] xl:max-w-[1800px] flex-col gap-4 px-2 pb-4 sm:px-4 md:px-6">

        <header className="shrink-0 py-2 sm:py-4 flex flex-col items-center text-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono uppercase tracking-wider">
            <Terminal className="size-3.5" />
            <span>RAG-Powered Portfolio Agent</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            Ask the AI Assistant
          </h1>
        </header>

        <Card className="flex flex-1 flex-col min-h-0 overflow-hidden border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl relative w-full">
          <div
            className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain"
            style={{ maxHeight: 'min(calc(100vh - 20rem), 100%)' }}
          >
            <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 w-full">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                  <Bot className="size-16 mb-4 text-primary/50" />
                  <p className="text-muted-foreground text-lg font-mono">Start a conversation.</p>
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
                  <div className={cn(
                    "size-8 sm:size-10 shrink-0 rounded-full flex items-center justify-center border shadow-sm mt-1",
                    message.role === 'assistant'
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-card/60 border-border/50 text-muted-foreground"
                  )}>
                    {message.role === 'assistant' ? <Bot className="size-5" /> : <User className="size-5" />}
                  </div>

                  <div
                    className={cn(
                      'rounded-2xl px-5 py-3.5 sm:px-6 sm:py-4 shadow-sm text-sm sm:text-base leading-relaxed max-w-full overflow-x-auto',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted/50 border border-border/50 backdrop-blur-sm text-foreground rounded-tl-sm w-full'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <ChatMarkdown content={dedupeRepeatedResponse(normalizeAssistantContent(cleanAssistantContent(message.content)))} />
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
                    <span className="text-xs text-muted-foreground font-mono uppercase tracking-wide">processing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-px w-px shrink-0" />
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-gradient-to-t from-background via-background/95 to-transparent pt-10">
            {!showLimitMessage && messages.length <= 1 && (
              <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide justify-start sm:justify-center">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-full border-border/60 bg-background/50 backdrop-blur hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300 font-mono text-xs"
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="relative flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 p-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-lg w-full max-w-4xl mx-auto"
            >
              <Input
                data-testid="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about architecture, systems, or projects..."
                className="flex-1 bg-transparent border-0 focus-visible:ring-0 px-4 py-3 h-auto text-base placeholder:text-muted-foreground/50"
                disabled={isLoading || showLimitMessage}
              />
              <Button
                data-testid="chat-send"
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

            {messages.length > 2 && !emailSent && (
              <div className="text-center mt-2">
                {!showEmailCapture ? (
                  <button
                    type="button"
                    onClick={() => setShowEmailCapture(true)}
                    className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 font-mono"
                  >
                    <Mail className="size-3" /> Email me this conversation
                  </button>
                ) : (
                  <form
                    className="flex flex-wrap items-center justify-center gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const email = (form.querySelector('input[name="email"]') as HTMLInputElement)?.value?.trim();
                      if (!email) return;
                      try {
                        const res = await fetch('/api/chat/save-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ session_id: sessionIdRef.current, email }),
                        });
                        if (res.ok) setEmailSent(true);
                      } catch { /* ignore */ }
                    }}
                  >
                    <input
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      className="rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-mono w-44"
                      required
                    />
                    <Button type="submit" size="sm" variant="outline" className="text-xs font-mono h-8">
                      Save
                    </Button>
                  </form>
                )}
              </div>
            )}

            {!showLimitMessage && (
              <div className="text-center mt-2.5">
                <span className="text-[10px] text-muted-foreground/40 font-mono">
                  {sessionMessageCount}/10 queries remaining (engaged chats get more)
                </span>
              </div>
            )}

            {showLimitMessage && (
              <div className="mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5 text-center">
                <p className="text-primary text-sm font-mono mb-1">session limit reached</p>
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
