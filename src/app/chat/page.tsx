'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { incrementSessionMessageCount, isSessionLimitReached, getSessionMessageCount } from '@/lib/rate-limit';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Tell me about Luis experience experience",
  "What GCP services has Luis used?",
  "Describe the Churnistic project",
  "What's Luis experience tech stack?",
  "Is Luis open to remote work?",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Luis experience AI assistant. Ask me anything about his work, experience, or projects!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check on mount if limit already reached
    if (isSessionLimitReached()) {
      setShowLimitMessage(true);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get response');
      }

      // Handle both streaming and non-streaming responses
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/plain')) {
        // Cached response - plain text
        const text = await response.text();
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: text,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Streaming response - NDJSON
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('0:')) {
                try {
                  const data = JSON.parse(line.substring(2));
                  if (data.text) {
                    assistantContent += data.text;
                    // Update the last message in real-time
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMsg = newMessages[newMessages.length - 1];
                      if (lastMsg?.role === 'assistant') {
                        lastMsg.content = assistantContent;
                      } else {
                        newMessages.push({
                          id: Date.now().toString(),
                          role: 'assistant',
                          content: assistantContent,
                        });
                      }
                      return newMessages;
                    });
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }
      }

      incrementSessionMessageCount();
      if (isSessionLimitReached()) {
        setShowLimitMessage(true);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    if (showLimitMessage) return;
    setInput(prompt);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-[#32c0f4]" />
          <h1 className="text-2xl font-bold">AI Chat</h1>
        </div>

        <p className="text-gray-400 mb-6">
          Ask me anything about Luis experience experience, projects, or skills!
        </p>

        {/* Suggested Prompts */}
        {!showLimitMessage && messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSuggestedPrompt(prompt)}
                className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-full text-gray-300 hover:bg-white/10 hover:border-[#32c0f4]/30 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Chat Container */}
        <div className="bg-gray-900/50 rounded-xl border border-white/10 h-[500px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#32c0f4]/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-[#32c0f4]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-[#32c0f4]/20 text-white'
                      : 'bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#32c0f4]/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#32c0f4]" />
                </div>
                <div className="bg-white/5 rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#32c0f4]" />
                </div>
              </div>
            )}
            {showLimitMessage && (
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-center">
                <p className="text-orange-400 mb-2">
                  You have used all your chat messages for this session.
                </p>
                <p className="text-gray-400 text-sm mb-3">
                  Contact Luis directly for detailed questions.
                </p>
                <a
                  href="mailto:luisgimenezdev@gmail.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#32c0f4] text-black rounded-lg hover:bg-[#32c0f4]/90 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Email Luis
                </a>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Luis experience experience..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#32c0f4]/50"
                disabled={isLoading || showLimitMessage}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || showLimitMessage}
                className="px-4 py-2 bg-[#32c0f4] text-black rounded-lg hover:bg-[#32c0f4]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {!showLimitMessage && (
              <p className="text-xs text-gray-500 mt-2">
                {getSessionMessageCount()}/20 messages used this session
              </p>
            )}
          </form>
        </div>

        {/* How it works */}
        <div className="mt-6 p-4 bg-gray-900/30 rounded-lg border border-white/5">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">How this works</h3>
          <p className="text-xs text-gray-500">
            This AI chat uses Google Gemini API with a knowledge base about Luis experience. 
            Responses are cached to stay within free tier limits. For detailed questions, 
            email Luis directly at luisgimenezdev@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
