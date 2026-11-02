import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, CreditCard, History, Pencil, Plus, TriangleAlert, type LucideIcon } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { RepStatusBadge } from "@/components/rep/StatusBadge";
import { CATEGORIES } from "@/lib/admin/catalogue";
import { fmtDay, kes, quarterLabel } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { OrderWindow } from "@/lib/rep/context";
import type { DOrder } from "@/lib/rep/dashboard";

const NAME = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

function Action({ href, icon: Icon, disabled, reason, primary, children }: {
  href: string; icon: LucideIcon; disabled?: boolean; reason?: string | null; primary?: boolean; children: ReactNode;
}) {
  if (disabled) {
    return (
      <span aria-disabled="true" title={reason ?? undefined} className={cn(buttonStyles({ variant: "outline" }), "cursor-not-allowed border-line bg-canvas text-subtle")}>
        <Icon size={18} aria-hidden /> {children}
      </span>
    );
  }
  return <Link href={href} className={buttonStyles({ variant: primary ? "primary" : "outline" })}><Icon size={18} aria-hidden /> {children}</Link>;
}

export function OrderCard({ order, window: w }: { order: DOrder | null; window: OrderWindow }) {
  const inOpenQuarter = !!order && order.quarter_id === w.quarter?.id;
  const quarterName = order?.quarters?.name ?? w.quarter?.name ?? "";
  const items = order?.order_items.filter((i) => i.quantity > 0) ?? [];
  const units = items.reduce((n, i) => n + i.quantity, 0);
  const due = order ? Math.max(Number(order.total_amount_kes) - Number(order.amount_paid_kes), 0) : 0;

  const payable = !!order && inOpenQuarter && order.status === "awaiting_payment" && w.state === "open";
  const amendable = !!order && inOpenQuarter && (order.status === "awaiting_payment" || order.status === "paid") && w.state === "open";
  const overdueUnpaid = !!order && inOpenQuarter && order.status === "awaiting_payment" && w.state === "passed";

  const placeReason =
    w.state === "none" ? "No quarter is open for ordering"
    : w.state === "upcoming" ? `Ordering opens on ${fmtDay(w.quarter!.open_date)}`
    : w.state === "passed" ? "The ordering deadline has passed"
    : inOpenQuarter ? (order!.status === "cancelled" ? "Your order for this quarter was cancelled. Contact HHES to place a new one." : "You already have an order. Use Edit Order to change it.")
    : null;
  const editReason = amendable ? null
    : !order ? "Place an order first"
    : !inOpenQuarter || w.state !== "open" ? "Orders can't be changed right now"
    : order.status === "cancelled" ? "This order was cancelled"
    : "Orders that are ready or collected can't be changed. Contact HHES.";

  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-6 sm:px-8">
        <div>
          <h2 className="font-sans text-xl font-semibold text-ink">My Current Order Status</h2>
          {quarterName && <p className="mt-1 text-[15px] text-muted">{quarterLabel(quarterName)}</p>}
        </div>
        {order && <RepStatusBadge status={order.status} payment={order.payment_status} />}
      </div>

      <div className="px-6 py-6 sm:px-8">
        {payable && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-field bg-warning-soft px-5 py-4">
            <p className="text-[15px] leading-relaxed text-warning">
              {order!.payment_status === "failed" ? "Your last M-Pesa payment wasn't completed. " : ""}
              Pay <strong className="font-mono font-semibold">{kes(due)}</strong> with M-Pesa to secure your order.
            </p>
            <Link href={`/rep/order/${order!.id}/pay`} className={buttonStyles({ size: "sm" })}><CreditCard size={16} aria-hidden /> Pay now</Link>
          </div>
        )}
        {overdueUnpaid && (
          <p className="mb-6 flex gap-3 rounded-field bg-danger-soft px-5 py-4 text-[15px] leading-relaxed text-danger">
            <TriangleAlert size={20} className="mt-0.5 shrink-0" aria-hidden />
            The deadline passed before this order was paid. Contact HHES if you still need these books.
          </p>
        )}
        {order?.refund_due && (
          <p className="mb-6 rounded-field bg-primary-soft px-5 py-4 text-[15px] leading-relaxed text-ink">
            A refund of <strong className="font-mono font-semibold">{kes(order.refund_amount_kes)}</strong> is pending with HHES finance.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Action href="/rep/order/place" icon={Plus} primary disabled={!!placeReason} reason={placeReason}>Place Order</Action>
          <Action href={order ? `/rep/order/${order.id}/edit` : "#"} icon={Pencil} disabled={!amendable} reason={editReason}>Edit Order</Action>
          <Action href="/rep/catalogue" icon={BookOpen}>View Catalogue</Action>
          <Action href="/rep/orders" icon={History}>View Order History</Action>
        </div>

        {order ? (
          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">Order Summary Snapshot</h3>
              <p className="text-[15px] text-muted">Total Items: {units.toLocaleString("en-KE")} Books</p>
            </div>
            <div className="mt-3 overflow-hidden rounded-field border border-line">
              <table className="w-full text-left">
                <thead className="bg-panel">
                  <tr><th className="px-5 py-3.5 text-[15px] font-medium text-muted">Book Category</th><th className="px-5 py-3.5 text-right text-[15px] font-medium text-muted">Quantity Ordered</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((i) => (
                    <tr key={i.category_slug}>
                      <td className="px-5 py-4 text-base font-medium text-ink">{NAME[i.category_slug] ?? i.category_slug}</td>
                      <td className="px-5 py-4 text-right text-base tabular-nums text-ink">{i.quantity.toLocaleString("en-KE")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-muted">
              Order <span className="font-mono text-ink">{order.reference}</span> · Total <span className="font-mono text-ink">{kes(order.total_amount_kes)}</span> · Paid <span className="font-mono text-ink">{kes(order.amount_paid_kes)}</span>
            </p>
          </div>
        ) : (
          <div className="mt-8 rounded-field border border-dashed border-line-strong px-6 py-10 text-center">
            <p className="text-base font-medium text-ink">{w.canOrder ? `You haven't placed an order for ${quarterName} yet.` : "There's no order to show."}</p>
            <p className="mt-1 text-[15px] text-muted">{w.canOrder ? "Orders are paid by M-Pesa before pickup." : placeReason}</p>
          </div>
        )}
      </div>
    </section>
  );
}