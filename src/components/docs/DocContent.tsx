import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const docComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="text-2xl font-semibold text-foreground border-b border-border pb-2 mb-6 mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-xl font-semibold text-foreground mt-8 mb-3 scroll-mt-20" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-lg font-medium text-foreground mt-6 mb-2 scroll-mt-20" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="text-muted-foreground leading-relaxed mb-4 last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-primary/50 pl-4 py-1 my-4 text-muted-foreground italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code
          className={`block text-sm bg-muted/80 rounded-lg p-4 overflow-x-auto font-mono ${className ?? ""}`}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className="text-sm bg-muted/80 px-1.5 py-0.5 rounded font-mono" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre className="mb-4 rounded-lg overflow-hidden" {...props}>
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full border-collapse text-sm text-muted-foreground" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="border-b border-border" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th className="text-left font-medium text-foreground py-2 pr-4" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="py-2 pr-4 border-b border-border/50" {...props}>
      {children}
    </td>
  ),
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      className="text-primary hover:underline"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  hr: () => <hr className="border-border my-8" />,
};

export default function DocContent({ content }: { content: string }) {
  return (
    <article className="docs-content max-w-3xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={docComponents}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
