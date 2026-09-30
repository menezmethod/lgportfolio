import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects";
import { renderOg } from "@/lib/og";

export const alt = "Case study";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  return renderOg(`Case study / ${p.kind}`, p.title);
}
