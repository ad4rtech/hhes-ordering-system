"use client";

import { useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChartColumn, CircleCheck, CircleX, Clock, Inbox, ShieldCheck, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { ExportMenu } from "./ExportMenu";
import { NotYetOrdered } from "./NotYetOrdered";
import { useLiveRefresh } from "@/lib/useLiveRefresh";
import { fmtDayMonth, fmtStamp } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { ReportData, RQuarter } from "@/lib/admin/reports";
import type { StockStatus } from "@/lib/reports/stock";

const LIVE = ["orders"];
const n = (v: number) => v.toLocaleString("en-KE");
const signed = (v: number) => (v > 0 ? `+${n(v)}` : n(v));

const STATUS: Record<StockStatus, [BadgeTone, string]> = {
  healthy: ["success", "Healthy"], low: ["attention", "Low"], critical: ["danger", "Critical"], none: ["neutral", "No stock set"],
};
const VARIANCE: Record<StockStatus, string> = {
  healthy: "text-success", low: "text-attention", critical: "text-danger-solid", none: "text-muted",
};

function Stat({ label, value, icon: Icon, children }: { label: string; value: number; icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] text-muted">{label}</p>
        <Icon size={20} className="text-muted" aria-hidden />
      </div>
      <p className="mt-4 text-4xl font-bold tabular-nums text-ink">{n(value)}</p>
      <p className="mt-3 flex items-center gap-1.5 text-[15px]">{children}</p>
    </div>
  );
}

export function ReportsView({ quarters, selected, stats, demand, notOrdered, overrides }: ReportData & { selected: RQuarter }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  useLiveRefresh(LIVE);

  const pick = (id: string) => startTransition(() => router.push(`/admin/reports?quarter=${id}`));
  const delta = stats.previousTotal ? Math.round(((stats.total - stats.previousTotal) / stats.previousTotal) * 100) : null;
  const cancelledPct = stats.total ? Math.round((stats.cancelled / stats.total) * 1000) / 10 : 0;

  return (
    <div className={cn("transition-opacity", isPending && "opacity-60")}>
      <PageHeader title="Reports & Analytics" subtitle="Monitor demand, compliance, and historical trends."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect label="Quarter" value={selected.id} onChange={pick}
              options={quarters.map((q) => [q.id, `${q.name} (${q.status === "published" ? "Active" : "Closed"})`] as const)} />
            <ExportMenu quarterId={selected.id} />
          </div>
        } />

      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Orders Received" value={stats.total} icon={Inbox}>
          {delta === null ? <span className="text-muted">No earlier quarter to compare</span>
            : delta > 0 ? <span className="flex items-center gap-1.5 text-success"><TrendingUp size={16} aria-hidden /> +{delta}% vs last quarter</span>
            : delta < 0 ? <span className="flex items-center gap-1.5 text-danger"><TrendingDown size={16} aria-hidden /> {delta}% vs last quarter</span>
            : <span className="text-muted">No change vs last quarter</span>}
        </Stat>
        <Stat label="Pending / Submitted" value={stats.pending} icon={Clock}>
          <span className="text-muted">{stats.awaitingPayment} awaiting payment · {stats.paid} to prepare</span>
        </Stat>
        <Stat label="Ready & Collected" value={stats.fulfilled} icon={CircleCheck}>
          <span className={stats.fulfilled ? "text-success" : "text-muted"}>{stats.ready} ready · {stats.collected} collected</span>
        </Stat>
        <Stat label="Cancelled Orders" value={stats.cancelled} icon={CircleX}>
          <span className="text-muted">{cancelledPct}% of all orders</span>
          {stats.refundsDue > 0 && <span className="font-medium text-warning">· {stats.refundsDue} refund{stats.refundsDue === 1 ? "" : "s"} due</span>}
        </Stat>
      </div>

      {/* Demand summary */}
      <section className="mt-8 overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <h2 className="flex items-center gap-3 font-sans text-lg font-semibold text-ink">
            <ChartColumn size={22} className="text-primary" aria-hidden /> Real-time Demand Summary ({selected.name})
          </h2>
          {selected.status === "published" && (
            <Badge tone="positive"><span className="mr-2 size-2 animate-pulse rounded-full bg-white/90" aria-hidden />Auto-Refreshes</Badge>
          )}
        </div>
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-panel">
              <tr>
                <th className="px-6 py-4 text-[15px] font-medium text-muted">Category</th>
                <th className="px-6 py-4 text-right text-[15px] font-medium text-muted">Total Ordered</th>
                <th className="px-6 py-4 text-right text-[15px] font-medium text-muted">Available Stock</th>
                <th className="px-6 py-4 text-right text-[15px] font-medium text-muted">Variance</th>
                <th className="px-6 py-4 text-[15px] font-medium text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {demand.map((d) => {
                const [tone, label] = STATUS[d.status];
                const noStock = d.status === "none";
                return (
                  <tr key={d.slug}>
                    <td className="px-6 py-5 text-base font-medium text-ink">{d.name}</td>
                    <td className="px-6 py-5 text-right text-base font-medium tabular-nums text-ink">{n(d.ordered)}</td>
                    <td className="px-6 py-5 text-right text-base tabular-nums text-muted">{noStock ? "—" : n(d.stock)}</td>
                    <td className={cn("px-6 py-5 text-right text-base tabular-nums", VARIANCE[d.status])}>{noStock ? "—" : signed(d.variance)}</td>
                    <td className="px-6 py-5"><Badge tone={tone}>{label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Not yet ordered + override audit log */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
        <NotYetOrdered orgs={notOrdered} quarter={selected} />

        <section className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="flex items-center justify-between gap-3 px-6 py-6">
            <h2 className="flex items-center gap-3 font-sans text-lg font-semibold text-ink">
              <ShieldCheck size={22} className="text-primary" aria-hidden /> Override Audit Log
            </h2>
            <Link href="/admin/quarters#extensions" className="text-[15px] font-medium text-primary hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[460px] text-left">
              <thead className="bg-panel">
                <tr>
                  <th className="px-6 py-3.5 text-sm font-medium text-muted">Organisation</th>
                  <th className="px-6 py-3.5 text-sm font-medium text-muted">Exception Details</th>
                  <th className="px-6 py-3.5 text-right text-sm font-medium text-muted">Actioned By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {overrides.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-10 text-center text-[15px] text-muted">No deadline extensions this quarter.</td></tr>
                ) : overrides.map((o) => (
                  <tr key={o.id}>
                    <td className="px-6 py-4">
                      <p className="text-[15px] font-medium text-ink">{o.organisation}</p>
                      <p className="mt-0.5 text-sm text-muted">{fmtStamp(o.granted_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[15px] text-ink">Deadline: {fmtDayMonth(o.original)} → <span className="font-semibold">{fmtDayMonth(o.next)}</span></p>
                      <p className="mt-0.5 text-sm italic leading-relaxed text-muted">&ldquo;{o.reason}&rdquo;</p>
                    </td>
                    <td className="px-6 py-4 text-right text-[15px] text-ink">{o.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}