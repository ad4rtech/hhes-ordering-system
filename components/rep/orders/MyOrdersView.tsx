"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui/Button";
import { StatusTracker } from "./StatusTracker";
import { CurrentOrderCard } from "./CurrentOrderCard";
import { HistoryList } from "./HistoryList";
import { MyOrderPanel } from "./MyOrderPanel";
import { CancelOrderDialog, type CancelTarget } from "./CancelOrderDialog";
import { LiveRefresh } from "@/components/rep/LiveRefresh";
import { canAmend, startBlockedReason } from "@/lib/rep/rules";
import type { OrderWindow } from "@/lib/rep/context";
import type { MyOrder, StepDates } from "@/lib/rep/myOrders";

export function MyOrdersView({ current, history, dates, window: w, pickup, openOrder }: {
  current: MyOrder | null; history: MyOrder[]; dates: StepDates; window: OrderWindow;
  pickup: { address: string; hours: string }; openOrder?: string;
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(openOrder ?? null);
  const [cancel, setCancel] = useState<CancelTarget | null>(null);

  const done = () => { setCancel(null); router.refresh(); };
  const blocked = startBlockedReason(w);

  return (
    <>
      <LiveRefresh />

      {current && (
        <section className="mt-8">
          <p className="mb-3 text-[15px] font-medium text-muted">Current order status</p>
          <StatusTracker order={current} dates={dates} />
        </section>
      )}

      <h1 className="mt-10 text-3xl font-bold text-ink sm:text-[32px]">My Orders</h1>
      <p className="mt-3 max-w-[680px] text-base leading-relaxed text-muted">View and manage your current active order and track your organisation's past order history.</p>

      {w.quarter && (
        <section className="mt-9">
          <h2 className="mb-5 font-sans text-2xl font-semibold text-ink">Current Quarter</h2>
          {current ? (
            <CurrentOrderCard order={current} dates={dates} pickup={pickup}
              amendable={w.state === "open" && canAmend(current.status, w)}
              onCancel={() => setCancel({ id: current.id, reference: current.reference, paid: Number(current.amount_paid_kes), status: current.status })} />
          ) : (
            <div className="rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
              <p className="text-base font-medium text-ink">You haven't placed an order for {w.quarter.name} yet.</p>
              <p className="mx-auto mt-1 max-w-md text-[15px] text-muted">{blocked ?? "Orders are paid by M-Pesa before pickup."}</p>
              {!blocked && <Link href="/rep/order/place" className={`${buttonStyles()} mt-6`}>Place Order</Link>}
            </div>
          )}
        </section>
      )}

      <HistoryList orders={history} onView={setOpenId} />

      <MyOrderPanel orderId={openId} windowState={w.state} currentQuarterId={w.quarter?.id ?? null} pickup={pickup}
        onClose={() => setOpenId(null)} onCancel={(o) => setCancel(o)} />
      <CancelOrderDialog order={cancel} onClose={() => setCancel(null)} onDone={() => { setOpenId(null); done(); }} />
    </>
  );
}