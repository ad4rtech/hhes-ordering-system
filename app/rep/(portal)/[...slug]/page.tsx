import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";

const KNOWN: Record<string, string> = { order: "Order", orders: "My Orders", catalogue: "Catalogue", reports: "Reports", profile: "Organisation Profile" };

export default async function ComingSoon({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const title = KNOWN[slug[0]];
  if (!title) notFound();
  return (
    <>
      <PageHeader title={title} />
      <div className="rounded-card border border-dashed border-line-strong bg-surface p-12 text-center text-muted">This page is coming soon.</div>
    </>
  );
}