"use client";

import { useMemo, useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RepStatusBadge } from "@/components/rep/StatusBadge";
import { fmtDay, kes } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { MyOrder } from "@/lib/rep/myOrders";

export function HistoryList({ orders, onView }: { orders: MyOrder[]; onView: (id: string) => void }) {
  const [quarter, setQuarter] = useState("");
  const quarters = useMemo(() => [...new Map(orders.map((o) => [o.quarter_id, o.quarters?.name ?? "Earlier"])).entries()], [orders]);
  const shown = quarter ? orders.filter((o) => o.quarter_id === quarter) : orders;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-sans text-2xl font-semibold text-ink">Order History</h2>
        {orders.length > 0 && (
          <label className="relative flex h-11 items-center rounded-field border border-line bg-surface pl-4 pr-10 text-[15px] focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
            <select value={quarter} onChange={(e) => setQuarter(e.target.value)} aria-label="Filter by quarter"
              className="cursor-pointer appearance-none bg-transparent font-medium text-ink focus:outline-none">
              <option value="">All Quarters</option>
              {quarters.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 text-muted" aria-hidden />
          </label>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-panel text-muted"><History size={24} aria-hidden /></span>
          <p className="text-base font-medium text-ink">{orders.length === 0 ? "No earlier orders yet" : "No orders for this quarter"}</p>
          <p className="max-w-sm text-[15px] text-muted">{orders.length === 0 ? "Orders from past quarters will be listed here." : "Choose another quarter to see more."}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-5">
          {shown.map((o) => {
            const units = o.order_items.reduce((n, i) => n + i.quantity, 0);
            const cancelled = o.status === "cancelled";
            return (
              <li key={o.id} className="overflow-hidden rounded-card border border-line bg-surface">
                <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-5 sm:px-8">
                  <div>
                    <h3 className="flex flex-wrap items-center gap-3 font-sans text-lg font-semibold text-ink">{o.quarters?.name} Order {o.is_historical && <Badge tone="neutral">Imported</Badge>}</h3>
                    <p className="mt-1 text-[15px] text-muted">Order ID: <span className="font-mono">{o.reference}</span> <span className="mx-2">•</span> Submitted: {fmtDay(o.submitted_at ?? o.created_at)}</p>
                  </div>
                  <RepStatusBadge status={o.status} payment={o.payment_status} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 sm:px-8">
                  <p className={cn("text-base", cancelled && "text-muted line-through")}>
                    <strong className="font-semibold text-ink">{units.toLocaleString("en-KE")} Units</strong> <span className="mx-2 text-muted">•</span> <span className="font-mono text-ink">{kes(o.total_amount_kes)}</span>
                  </p>
                  <Button variant="outline" size="sm" onClick={() => onView(o.id)}>View Details</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}