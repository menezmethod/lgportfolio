import { readFileSync, existsSync } from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allDocs, getDocBySlug } from "@/lib/docs-config";
import DocContent from "@/components/docs/DocContent";

const DOCS_DIR = path.join(process.cwd(), "docs");

function getDocContent(entry: { file: string }): string {
  const filePath = path.join(DOCS_DIR, entry.file);
  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf-8");
}

export function generateStaticParams() {
  const withIndex = [{ slug: [] as string[] }, ...allDocs.map((doc) => ({ slug: doc.slug.split("/") }))];
  return withIndex;
}

export default async function DocsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-foreground border-b border-border pb-2 mb-6">
          Documentation
        </h1>
        <p className="text-muted-foreground mb-8">
          Technical documentation for deployment, architecture, CI, and architecture decision
          records (ADRs).
        </p>
        <ul className="space-y-3">
          {allDocs.map((doc) => (
            <li key={doc.slug}>
              <Link
                href={`/docs/${doc.slug}`}
                className="text-primary hover:underline font-medium"
              >
                {doc.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const entry = getDocBySlug(slug);
  if (!entry) notFound();

  const content = getDocContent(entry);
  if (!content) notFound();

  return (
    <>
      <div className="mb-6">
        <Link
          href="/docs"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Documentation
        </Link>
      </div>
      <DocContent content={content} />
    </>
  );
}
