import DocsSidebar from "@/components/docs/DocsSidebar";

export const metadata = {
  title: "Documentation | gimenez.dev",
  description: "Technical documentation: deployment, architecture, CI, and ADRs.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <DocsSidebar />
        <div className="flex-1 p-6 md:p-10">{children}</div>
      </div>
    </div>
  );
}
