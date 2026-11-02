import Link from "next/link";
import { CircleCheck, CircleX, FileCheck2, Package, Smartphone, type LucideIcon } from "lucide-react";
import { fmtDay, kes } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { MyOrder, StepDates } from "@/lib/rep/myOrders";

type StepState = "done" | "current" | "todo";
type Step = { title: string; body: string; icon: LucideIcon; state: StepState; action?: { href: string; label: string } };

export function StatusTracker({ order, dates }: { order: MyOrder; dates: StepDates }) {
  if (order.status === "cancelled") {
    return (
      <div className="flex items-start gap-4 rounded-card border border-line bg-surface px-6 py-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-field bg-canvas text-muted"><CircleX size={22} aria-hidden /></span>
        <div>
          <p className="text-base font-semibold text-ink">This order was cancelled</p>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">
            {order.refund_due ? <>A refund of <span className="font-mono text-ink">{kes(order.refund_amount_kes)}</span> is pending with HHES finance. </> : null}
            To order again this quarter, contact HHES.
          </p>
        </div>
      </div>
    );
  }

  const st = order.status;
  const quarter = order.quarters?.name ?? "this quarter";
  const due = Math.max(Number(order.total_amount_kes) - Number(order.amount_paid_kes), 0);
  const paid = st !== "awaiting_payment";

  const steps: Step[] = [
    { title: "Order Placed", icon: FileCheck2, state: "done",
      body: `Quantities were entered and saved for ${quarter}${order.submitted_at ? ` on ${fmtDay(order.submitted_at)}` : ""}.` },
    paid
      ? { title: "Payment", icon: Smartphone, state: "done", body: `Paid by M-Pesa${dates.paidAt ? ` on ${fmtDay(dates.paidAt)}` : ""}${dates.receipt ? `. Receipt ${dates.receipt}` : ""}.` }
      : { title: "Payment", icon: Smartphone, state: "current",
          body: `${order.payment_status === "failed" ? "Your last payment wasn't completed. " : ""}Waiting for your M-Pesa payment of ${kes(due)}.`,
          action: { href: `/rep/order/${order.id}/pay`, label: "Pay now" } },
    { title: "Ready for Pickup", icon: Package,
      state: st === "paid" ? "current" : st === "ready_for_pickup" || st === "collected" ? "done" : "todo",
      body: st === "ready_for_pickup" || st === "collected"
        ? `Ready${dates.readyAt ? ` since ${fmtDay(dates.readyAt)}` : ""}. HHES packed your books.`
        : "You will be notified once packing is complete." },
    { title: "Collected", icon: CircleCheck, state: st === "collected" ? "done" : st === "ready_for_pickup" ? "current" : "todo",
      body: st === "collected" ? `Collected${dates.collectedAt ? ` on ${fmtDay(dates.collectedAt)}` : ""}. Order complete.`
        : st === "ready_for_pickup" ? "Collect your books at HHES. A digital pickup confirmation completes the order."
        : "Digital pickup confirmation will complete the order trail." },
  ];

  return (
    <ol className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Order progress">
      {steps.map((s) => {
        const Icon = s.icon;
        return (
          <li key={s.title} aria-current={s.state === "current" ? "step" : undefined}
            className={cn("flex gap-4 rounded-card border bg-surface px-5 py-5", s.state === "current" ? "border-primary bg-primary-soft/60 ring-1 ring-primary" : "border-line")}>
            <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-field",
              s.state === "done" ? "bg-positive text-white" : s.state === "current" ? "bg-primary text-white" : "bg-panel text-muted")}>
              <Icon size={22} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-ink">{s.title}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">{s.body}</p>
              {s.action && <Link href={s.action.href} className="mt-2 inline-block text-[15px] font-semibold text-primary hover:underline">{s.action.label}</Link>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}