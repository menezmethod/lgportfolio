'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils';

const chatMarkdownComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="text-lg font-semibold text-foreground mt-4 mb-2 first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-base font-semibold text-foreground mt-4 mb-2 first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-sm font-semibold text-foreground mt-3 mb-1.5 first:mt-0" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="text-sm text-muted-foreground leading-relaxed mb-2 last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground mb-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="text-primary underline underline-offset-2 hover:opacity-90"
      {...props}
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <pre className="mt-2 mb-3 overflow-x-auto rounded-lg bg-muted/80 border border-border/60 p-4 text-xs sm:text-sm">
          <code className={cn('text-foreground/90', className)} {...props}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code
        className="rounded bg-muted/80 px-1.5 py-0.5 text-xs font-mono text-foreground/90 border border-border/40"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre className="mt-2 mb-3 overflow-x-auto rounded-lg bg-muted/80 border border-border/60 p-4 text-xs sm:text-sm" {...props}>
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/60" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-border/50" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="border-border/50" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-3 text-left font-semibold text-foreground align-top"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-3 text-muted-foreground align-top leading-relaxed" {...props}>
      {children}
    </td>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-primary/50 pl-4 my-2 text-muted-foreground italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
};

export function ChatMarkdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('chat-markdown text-sm leading-relaxed sm:text-[15px]', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={chatMarkdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
