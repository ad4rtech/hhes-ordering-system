import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRepContext } from "@/lib/rep/context";
import { loadRepReports } from "@/lib/rep/reports";
import { HistoryExport } from "@/components/rep/reports/HistoryExport";
import { GrowthChart } from "@/components/rep/reports/GrowthChart";
import { CategoryDonut } from "@/components/rep/reports/CategoryDonut";
import { AmendmentCard } from "@/components/rep/reports/AmendmentCard";
import { ComplianceCard } from "@/components/rep/reports/ComplianceCard";
import { TimelineCard } from "@/components/rep/reports/TimelineCard";
import { ReportCard } from "@/components/rep/reports/ReportCard";
import { LiveRefresh } from "@/components/rep/LiveRefresh";

export const metadata: Metadata = { title: "Organisation Reports" };

const Empty = ({ children }: { children: string }) => (
  <p className="rounded-field border border-dashed border-line-strong px-6 py-12 text-center text-[15px] text-muted">{children}</p>
);

export default async function RepReportsPage() {
  const ctx = await getRepContext();
  if (!ctx) redirect("/login");
  const d = await loadRepReports(ctx);
  const hasGrowth = d.growth.some((g) => g.value > 0);

  return (
    <>
      <LiveRefresh />
      <h1 className="text-3xl font-bold text-ink sm:text-[32px]">Organisation Reports</h1>
      <p className="mt-3 max-w-[720px] text-base leading-relaxed text-muted">Insights, compliance records, and complete order history for your organisation.</p>

      <div className="mt-8 space-y-6">
        <HistoryExport rows={d.rows} orgName={ctx.org.name} />

        <div className="grid gap-6 lg:grid-cols-2">
          <ReportCard title="Quarter-on-Quarter Growth" subtitle="Compare total lesson books ordered across recent quarters.">
            {hasGrowth ? <GrowthChart data={d.growth} /> : <Empty>Your totals will be charted here once you've ordered.</Empty>}
          </ReportCard>
          <ReportCard title="Category Breakdown"
            subtitle={d.breakdown ? `Age-group distribution for your most recent ${d.breakdown.quarter} order.` : "Age-group distribution for your most recent order."}>
            {d.breakdown ? <CategoryDonut total={d.breakdown.total} shares={d.breakdown.shares} /> : <Empty>Place an order to see how your books split across age groups.</Empty>}
          </ReportCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <AmendmentCard average={d.amendments.average} />
          <ComplianceCard {...d.compliance} />
        </div>

        <TimelineCard data={d.timeline} />
      </div>
    </>
  );
}