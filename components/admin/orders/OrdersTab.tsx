"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { OrderStatusBadge } from "@/components/admin/StatusBadges";
import { OrderPanel } from "./OrderPanel";
import { OrderSidebar } from "./OrderSidebar";
import { markOrder } from "@/lib/admin/orderActions";
import { useUrlParams } from "@/lib/useUrlParams";
import { fmtDay, kes } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { OQuarter, OrderListRow, OrdersData } from "@/lib/admin/orders";

const STATUS_OPTIONS = [
  ["", "All Active"], ["all", "All Statuses"], ["awaiting_payment", "Awaiting Payment"], ["paid", "Paid"],
  ["ready_for_pickup", "Ready for Pickup"], ["collected", "Collected"], ["cancelled", "Cancelled"],
  ["payment_failed", "Payment Failed"], ["refund_due", "Refund Due"],
] as const;
const TYPE_OPTIONS = [["", "All Types"], ["church", "Church"], ["university", "University"], ["school", "School"]] as const;
const TH = "px-6 py-4 text-[15px] font-medium text-muted";
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function OrdersTab({ quarters, selected, data, filters, openOrder }: {
  quarters: OQuarter[]; selected: OQuarter; data: OrdersData; filters: { q: string; status: string; type: string }; openOrder?: string;
}) {
  const { update, refresh, isPending } = useUrlParams();
  const [q, setQ] = useState(filters.q);
  const [openId, setOpenId] = useState<string | null>(openOrder ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [collect, setCollect] = useState<OrderListRow | null>(null);
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    if (q.trim() === filters.q) return;
    const t = setTimeout(() => update({ q: q.trim() || undefined, page: undefined }), 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const ref = (o: OrderListRow) => ({ id: o.id, reference: o.reference, org: o.organisation.name });
  async function ready(o: OrderListRow) { setBusy(o.id); const ok = await markOrder(ref(o), "ready_for_pickup"); setBusy(null); if (ok) refresh(); }
  async function collectNow() {
    if (!collect) return;
    setCollecting(true);
    const ok = await markOrder(ref(collect), "collected");
    setCollecting(false); setCollect(null);
    if (ok) refresh();
  }

  const { rows, count, page, pageSize } = data;
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);
  const filtered = !!(filters.q || filters.status || filters.type);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
      <section className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-3 p-6">
          <div className="relative min-w-[220px] flex-1">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order ID or organisation..." aria-label="Search orders"
              className="h-11 w-full rounded-field border border-line bg-surface pl-11 pr-3.5 text-[15px] text-ink placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15" />
          </div>
          <FilterSelect label="Status" value={filters.status} options={STATUS_OPTIONS} onChange={(v) => update({ status: v || undefined, page: undefined })} />
          <FilterSelect label="Org Type" value={filters.type} options={TYPE_OPTIONS} onChange={(v) => update({ type: v || undefined, page: undefined })} />
          <FilterSelect label="Quarter" value={selected.id} options={quarters.map((x) => [x.id, x.name] as const)} onChange={(v) => update({ quarter: v, page: undefined })} />
        </div>

        <div className={cn("overflow-x-auto border-t border-line transition-opacity", isPending && "opacity-60")}>
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-panel">
              <tr><th className={TH}>Order ID &amp; Date</th><th className={TH}>Organisation</th><th className={TH}>Total Units</th><th className={TH}>Status</th><th className={`${TH} text-right`}>Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-14 text-center text-muted">
                  {filtered ? "No orders match your filters." : "No orders in this quarter yet."}
                  {filtered && <div className="mt-4"><Button variant="outline" size="sm" onClick={() => { setQ(""); update({ q: undefined, status: undefined, type: undefined, page: undefined }); }}>Clear filters</Button></div>}
                </td></tr>
              ) : rows.map((o) => (
                <tr key={o.id} className="hover:bg-canvas">
                  <td className="px-6 py-5">
                    <p className="font-mono text-[15px] font-bold text-ink">{o.reference}</p>
                    <p className="text-sm text-muted">{fmtDay(o.submitted_at ?? o.created_at)}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[15px] font-medium text-ink">{o.organisation.name}</p>
                    <p className="text-sm text-muted">{cap(o.organisation.type)}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[15px] font-medium tabular-nums text-ink">{o.units.toLocaleString("en-KE")}</p>
                    <p className="text-sm text-muted">Across {o.categories} {o.categories === 1 ? "category" : "categories"}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1.5">
                      <OrderStatusBadge status={o.status} />
                      {o.status === "awaiting_payment" && o.payment_status === "failed" && <Badge tone="dangerSoft">Payment failed</Badge>}
                      {o.refund_due && <Badge tone="dangerSoft">Refund {kes(o.refund_amount_kes)}</Badge>}
                      {o.is_historical && <Badge tone="neutral">Imported</Badge>}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setOpenId(o.id)}>View</Button>
                      {!o.is_historical && o.status === "awaiting_payment" && <Button size="sm" disabled title="Waiting for M-Pesa payment">Mark Ready</Button>}
                      {!o.is_historical && o.status === "paid" && <Button size="sm" loading={busy === o.id} onClick={() => ready(o)}>Mark Ready</Button>}
                      {!o.is_historical && o.status === "ready_for_pickup" && <Button size="sm" variant="positive" onClick={() => setCollect(o)}>Mark Collected</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-4">
          <p className="text-[15px] text-muted">Showing {from}-{to} of {count.toLocaleString("en-KE")} orders</p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => update({ page: String(page - 1) })}>Previous</Button>
            <Button variant="outline" size="sm" disabled={to >= count || isPending} onClick={() => update({ page: String(page + 1) })}>Next</Button>
          </div>
        </div>
      </section>

      <OrderSidebar quarter={selected} progress={data.progress} notOrdered={data.notOrdered} onDone={refresh} />

      <OrderPanel orderId={openId} onClose={() => setOpenId(null)} onChanged={refresh} />
      <ConfirmDialog open={!!collect} onClose={() => setCollect(null)} loading={collecting} confirmLabel="Mark collected" onConfirm={collectNow}
        title={`Mark ${collect?.reference ?? ""} as collected?`}
        description={`Confirm ${collect?.organisation.name ?? "the organisation"} has picked up its books. The order is locked afterwards and they receive a pickup confirmation email.`} />
    </div>
  );
}