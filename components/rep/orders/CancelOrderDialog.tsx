"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cancelOrder } from "@/lib/rep/cancel";
import { kes } from "@/lib/utils/format";

export type CancelTarget = { id: string; reference: string; paid: number; status: string };

export function CancelOrderDialog({ order, onClose, onDone }: { order: CancelTarget | null; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!order) return;
    setBusy(true);
    const ok = await cancelOrder(order.id);
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <ConfirmDialog open={!!order} onClose={onClose} loading={busy} tone="danger"
      title={`Cancel order ${order?.reference ?? ""}?`} cancelLabel="Keep order" confirmLabel="Cancel order" onConfirm={go}
      description={order && (
        <span className="block space-y-3">
          <span className="block">
            {order.paid > 0
              ? <>You've paid <strong className="font-mono font-semibold text-ink">{kes(order.paid)}</strong> by M-Pesa. After cancelling, HHES finance will refund it to your M-Pesa.</>
              : "Your books are released and nothing is charged."}
          </span>
          {order.status === "ready_for_pickup" && <span className="block">HHES has already packed this order.</span>}
          <span className="block">This can't be undone. To order again this quarter, you'd need to contact HHES.</span>
        </span>
      )} />
  );
}