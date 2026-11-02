"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { markOrder } from "@/lib/admin/orderActions";
import { fmtDay } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { DashboardData } from "@/lib/admin/dashboard";

type Item = DashboardData["pickups"]["items"][number];
const waiting = (d: number) => (d === 0 ? "Ready today" : `Waiting ${d} ${d === 1 ? "day" : "days"}`);

export function PickupsCard({ pickups, quarterId }: { pickups: DashboardData["pickups"]; quarterId: string }) {
  const router = useRouter();
  const [target, setTarget] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);

  async function collect() {
    if (!target) return;
    setBusy(true);
    const ok = await markOrder({ id: target.id, reference: target.reference, org: target.org }, "collected");
    setBusy(false);
    setTarget(null);
    if (ok) router.refresh();
  }

  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-3">
          <h2 className="font-sans text-lg font-semibold text-ink">Pending Pickups</h2>
          {pickups.count > 0 && <Badge tone="attention">{pickups.count} Total</Badge>}
        </div>
        <Link href={`/admin/orders?quarter=${quarterId}&status=ready_for_pickup`} className="text-[15px] font-medium text-muted hover:text-ink">View All</Link>
      </div>
      {pickups.items.length === 0 ? (
        <p className="border-t border-line px-6 py-10 text-center text-[15px] text-muted">No orders are waiting for collection.</p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {pickups.items.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-base font-medium text-ink">{p.org}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  <span className="rounded-md bg-panel px-2 py-0.5 font-mono text-[13px]">{p.reference}</span>
                  <span>•</span><span>Marked ready: {fmtDay(p.readyAt)}</span>
                  <span>•</span><span className={cn("font-medium", p.waitingDays >= 7 ? "text-danger" : "text-attention")}>{waiting(p.waitingDays)}</span>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setTarget(p)}>Mark as Collected</Button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={!!target} onClose={() => setTarget(null)} loading={busy} confirmLabel="Mark collected" onConfirm={collect}
        title={`Mark ${target?.reference ?? ""} as collected?`}
        description={`Confirm ${target?.org ?? "the organisation"} has picked up its books. The order is locked afterwards and they receive a pickup confirmation email.`} />
    </section>
  );
}