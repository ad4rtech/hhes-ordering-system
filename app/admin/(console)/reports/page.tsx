import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { loadReports } from "@/lib/admin/reports";
import { PageHeader } from "@/components/admin/PageHeader";
import { ReportsView } from "@/components/admin/reports/ReportsView";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const quarter = typeof sp.quarter === "string" ? sp.quarter : undefined;
  const { selected, ...rest } = await loadReports(await createClient(), quarter);

  if (!selected) {
    return (
      <>
        <PageHeader title="Reports & Analytics" subtitle="Monitor demand, compliance, and historical trends." />
        <div className="rounded-card border border-line bg-surface px-6 py-16 text-center">
          <h2 className="font-sans text-lg font-semibold text-ink">No reports yet</h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">Reports appear once a quarter has been published.</p>
        </div>
      </>
    );
  }
  return <ReportsView key={selected.id} selected={selected} {...rest} />;
}