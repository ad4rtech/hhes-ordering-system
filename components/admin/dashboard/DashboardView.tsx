"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, CalendarClock, Clock, Download, List, Package, Plus, ShoppingCart, Tag, TriangleAlert, Users, type LucideIcon } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { PickupsCard } from "./PickupsCard";
import { FeedCard, NotYetOrderedCard, OverrideCard } from "./SideCards";
import { downloadCsv } from "@/lib/download";
import { useLiveRefresh } from "@/lib/useLiveRefresh";
import { fmtDate, kes } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { DashboardData } from "@/lib/admin/dashboard";
import type { StockStatus } from "@/lib/reports/stock";

const LIVE = ["orders", "mpesa_transactions"];
const n = (v: number) => v.toLocaleString("en-KE");

const STATUS: Record<StockStatus, [BadgeTone, string]> = {
  healthy: ["positive", "Healthy"], low: ["attention", "Low"], critical: ["danger", "Critical"], none: ["neutral", "No stock set"],
};
const REMAINING: Record<StockStatus, string> = { healthy: "text-ink", low: "text-attention", critical: "font-semibold text-danger-solid", none: "text-muted" };

function Stat({ label, icon: Icon, value, sub }: { label: string; icon: LucideIcon; value: ReactNode; sub: ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] text-muted">{label}</p>
        <Icon size={20} className="text-muted" aria-hidden />
      </div>
      <p className="mt-4 text-4xl font-bold tabular-nums text-ink">{value}</p>
      <p className="mt-3 text-[15px] text-muted">{sub}</p>
    </div>
  );
}

export function DashboardView(d: DashboardData) {
  const { selected, stats, money, demand } = d;
  const [exporting, setExporting] = useState(false);
  useLiveRefresh(LIVE);

  async function exportSummary() {
    if (!selected) return;
    setExporting(true);
    await downloadCsv(`/api/reports/demand?format=csv&quarter_id=${selected.id}`);
    setExporting(false);
  }

  const catalogueHref = `/admin/catalogue${d.draftId ?? selected?.id ? `?quarter=${d.draftId ?? selected?.id}` : ""}`;
  const actions = (
    <div className="flex flex-wrap gap-3">
      <Link href="/admin/quarters?new=1" className={buttonStyles()}><Plus size={18} aria-hidden /> Open New Quarter</Link>
      <Link href={catalogueHref} className={buttonStyles({ variant: "outline" })}><Tag size={18} aria-hidden /> Update Catalogue Prices</Link>
      <Button variant="outline" loading={exporting} disabled={!selected} onClick={exportSummary}><Download size={18} aria-hidden /> Export Quarter Summary</Button>
      <Link href={`/admin/orders${selected ? `?quarter=${selected.id}` : ""}`} className={buttonStyles({ variant: "outline" })}><List size={18} aria-hidden /> View All Orders</Link>
      <Link href="/admin/organisations" className={buttonStyles({ variant: "outline" })}><Users size={18} aria-hidden /> Manage Organisations</Link>
    </div>
  );

  if (!selected) {
    return (
      <>
        <section className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-panel text-muted"><CalendarClock size={24} aria-hidden /></span>
          <h1 className="font-sans text-xl font-semibold text-ink">No quarter yet</h1>
          <p className="max-w-md text-[15px] leading-relaxed text-muted">Create a quarter, set its prices in the catalogue, then publish it so organisations can start ordering.</p>
        </section>
        <div className="mt-6">{actions}</div>
      </>
    );
  }

  const open = selected.status === "published";
  const dl = stats.daysLeft;
  const countdown = !open ? "Closed" : dl === null ? "-" : dl < 0 ? "Passed" : dl === 0 ? "Today" : `${dl} ${dl === 1 ? "Day" : "Days"}`;

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Orders This Quarter" icon={ShoppingCart} value={n(stats.total)} sub={`Submitted for ${open ? "active " : ""}${selected.name}`} />
        <Stat label="Pending Pickup" icon={Package} value={n(stats.pendingPickup)} sub="Awaiting collection at centre" />
        <Stat label="Not Yet Ordered" icon={Clock} value={n(stats.notOrdered)} sub="Active organisations pending" />
        <Stat label="Deadline Countdown" icon={Calendar}
          value={<span className={cn(open && dl !== null && dl <= 3 && "text-warning")}>{countdown}</span>}
          sub={`${open ? "Closes" : "Closed"} ${fmtDate(selected.deadline_date)}, 23:59`} />
      </div>

      {/* Payments */}
      <section className="mt-5 grid divide-y divide-line rounded-card border border-line bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-5">
          <p className="text-[15px] text-muted">Revenue collected</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-ink">{kes(money.revenue)}</p>
          <p className="mt-1 text-sm text-muted">Paid orders, net of refunds</p>
        </div>
        <div className="p-5">
          <p className="text-[15px] text-muted">Refunds due</p>
          <p className={cn("mt-1.5 font-mono text-2xl font-bold", money.refundsCount ? "text-warning" : "text-ink")}>{kes(money.refundsKes)}</p>
          <p className="mt-1 text-sm text-muted">
            {money.refundsCount ? <Link href={`/admin/orders?quarter=${selected.id}&status=refund_due`} className="font-medium text-primary hover:underline">{money.refundsCount} {money.refundsCount === 1 ? "order" : "orders"} to refund</Link> : "Nothing to refund"}
          </p>
        </div>
        <div className="p-5">
          <p className="text-[15px] text-muted">Payments needing review</p>
          <p className={cn("mt-1.5 flex items-center gap-2 text-2xl font-bold", money.needsReview ? "text-danger-solid" : "text-ink")}>
            {money.needsReview > 0 && <TriangleAlert size={22} aria-hidden />}{n(money.needsReview)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {money.needsReview ? <Link href={`/admin/orders?tab=payments&quarter=${selected.id}`} className="font-medium text-primary hover:underline">Review now</Link> : "All M-Pesa payments are settled"}
          </p>
        </div>
      </section>

      {/* Order window */}
      <section className={cn("mt-5 flex flex-wrap items-center justify-between gap-4 rounded-card border border-line border-l-4 bg-surface px-6 py-5", open ? "border-l-positive" : "border-l-line-strong")}>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-bold text-ink">{selected.name} Order Window</h2>
            <Badge tone={open ? "positive" : "neutral"}>{open ? "Open" : "Closed"}</Badge>
          </div>
          <p className="mt-2 text-base text-muted">Window Open: {fmtDate(selected.open_date)} <span className="mx-2">—</span> Deadline: {fmtDate(selected.deadline_date)}</p>
        </div>
        <Link href="/admin/quarters" className={buttonStyles({ variant: "outline" })}>Manage Quarter <ArrowRight size={16} aria-hidden /></Link>
      </section>

      <div className="mt-5">{actions}</div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="flex items-center justify-between gap-3 px-6 py-5">
              <h2 className="font-sans text-lg font-semibold text-ink">Demand Summary</h2>
              <Button variant="outline" size="sm" loading={exporting} onClick={exportSummary}>Export CSV</Button>
            </div>
            <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[620px] text-left">
                <thead className="bg-panel">
                  <tr>{["Category", "Stock Set", "Total Ordered", "Remaining Stock", "Status"].map((h) => <th key={h} className="px-6 py-4 text-[15px] font-medium text-muted">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {demand.map((r) => {
                    const [tone, label] = STATUS[r.status];
                    const none = r.status === "none";
                    return (
                      <tr key={r.slug}>
                        <td className="px-6 py-4 text-base font-medium text-ink">{r.name}</td>
                        <td className="px-6 py-4 text-base tabular-nums text-ink">{none ? "—" : n(r.stock)}</td>
                        <td className="px-6 py-4 text-base tabular-nums text-ink">{n(r.ordered)}</td>
                        <td className={cn("px-6 py-4 text-base tabular-nums", REMAINING[r.status])}>{none ? "—" : n(r.remaining)}</td>
                        <td className="px-6 py-4"><Badge tone={tone}>{label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <PickupsCard pickups={d.pickups} quarterId={selected.id} />
        </div>

        <div className="space-y-6">
          <NotYetOrderedCard data={d.notOrdered} quarterId={selected.id} canRemind={open} />
          <FeedCard feed={d.feed} quarterId={selected.id} />
          <OverrideCard overrides={d.overrides} />
        </div>
      </div>
    </>
  );
}