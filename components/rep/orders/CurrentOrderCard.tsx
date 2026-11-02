"use client";

import Link from "next/link";
import { CreditCard, Pencil, XCircle } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { RepStatusBadge } from "@/components/rep/StatusBadge";
import { CHIP_NAME } from "@/lib/rep/names";
import { fmtDay, kes } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { MyOrder, StepDates } from "@/lib/rep/myOrders";

const Meta = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
    <p className="mt-2 text-lg font-medium text-ink">{children}</p>
  </div>
);

export function CurrentOrderCard({ order, dates, pickup, amendable, onCancel }: {
  order: MyOrder; dates: StepDates; pickup: { address: string; hours: string }; amendable: boolean; onCancel: () => void;
}) {
  const items = order.order_items.filter((i) => i.quantity > 0);
  const units = items.reduce((n, i) => n + i.quantity, 0);
  const due = Math.max(Number(order.total_amount_kes) - Number(order.amount_paid_kes), 0);
  const cancelled = order.status === "cancelled";
  const closed = cancelled || order.status === "collected";
  const payable = order.status === "awaiting_payment";

  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-panel px-6 py-6 sm:px-8">
        <div>
          <h3 className="font-sans text-xl font-semibold text-ink">{order.quarters?.name} Order</h3>
          <p className="mt-1.5 text-[15px] text-muted">
            Order ID: <span className="font-mono">{order.reference}</span> <span className="mx-2">•</span> Submitted: {fmtDay(order.submitted_at ?? order.created_at)}
          </p>
        </div>
        <RepStatusBadge status={order.status} payment={order.payment_status} />
      </div>

      <div className="px-6 py-6 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <Meta label="Total Items">{units.toLocaleString("en-KE")} Units</Meta>
          <Meta label="Total"><span className={cn("font-mono", cancelled && "text-muted line-through")}>{kes(order.total_amount_kes)}</span></Meta>
          <Meta label="Pickup Location">{pickup.address}</Meta>
        </div>
        {pickup.hours && <p className="mt-3 text-sm text-muted sm:text-right">Office hours: {pickup.hours}</p>}

        {!cancelled && (
          <div className={cn("mt-6 flex flex-wrap items-center justify-between gap-4 rounded-field px-5 py-4", payable ? "bg-warning-soft" : "bg-panel")}>
            {payable ? (
              <>
                <p className="text-[15px] leading-relaxed text-warning">
                  {order.payment_status === "failed" ? "Your last payment wasn't completed. " : ""}
                  <strong className="font-mono font-semibold">{kes(due)}</strong> is due by M-Pesa.
                </p>
                <Link href={`/rep/order/${order.id}/pay`} className={buttonStyles({ size: "sm" })}><CreditCard size={16} aria-hidden /> Pay now</Link>
              </>
            ) : (
              <p className="text-[15px] text-muted">
                Paid <span className="font-mono text-ink">{kes(order.amount_paid_kes)}</span>
                {dates.receipt && <> · M-Pesa receipt <span className="font-mono text-ink">{dates.receipt}</span></>}
                {dates.paidAt && <> · {fmtDay(dates.paidAt)}</>}
              </p>
            )}
          </div>
        )}
        {order.refund_due && (
          <p className="mt-4 rounded-field bg-primary-soft px-5 py-4 text-[15px] leading-relaxed text-ink">
            A refund of <strong className="font-mono font-semibold">{kes(order.refund_amount_kes)}</strong> is pending with HHES finance.
          </p>
        )}

        <div className="mt-6 border-t border-dashed border-line pt-6">
          <h4 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">Order Breakdown</h4>
          <ul className="mt-4 flex flex-wrap gap-3">
            {items.map((i) => (
              <li key={i.category_slug} className="rounded-field border border-line bg-panel px-4 py-2.5 text-[15px]">
                <span className="font-semibold tabular-nums text-ink">{i.quantity.toLocaleString("en-KE")}</span> <span className="text-muted">{CHIP_NAME[i.category_slug] ?? i.category_slug}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!closed && (
        <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-5 sm:px-8">
          {amendable
            ? <Link href={`/rep/order/${order.id}/edit`} className={buttonStyles({ variant: "outline" })}><Pencil size={18} aria-hidden /> Edit Order</Link>
            : <span aria-disabled="true" title={order.status === "ready_for_pickup" ? "This order is ready for pickup and can't be changed. Contact HHES." : "Orders can't be changed right now"}
                className={cn(buttonStyles({ variant: "outline" }), "cursor-not-allowed bg-canvas text-subtle")}><Pencil size={18} aria-hidden /> Edit Order</span>}
          <Button variant="dangerOutline" onClick={onCancel}><XCircle size={18} aria-hidden /> Cancel Order</Button>
        </div>
      )}
    </section>
  );
}