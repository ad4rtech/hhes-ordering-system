"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { remindAll, remindOrg } from "@/lib/admin/reminderActions";
import { fmtDate } from "@/lib/utils/format";
import type { OQuarter, OrdersData } from "@/lib/admin/orders";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function OrderSidebar({ quarter, progress, notOrdered, onDone }: {
  quarter: OQuarter; progress: OrdersData["progress"]; notOrdered: OrdersData["notOrdered"]; onDone: () => void;
}) {
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const canRemind = quarter.status === "published";
  const pct = progress.target ? Math.min(100, Math.round((progress.submitted / progress.target) * 100)) : 0;

  const d = progress.daysLeft;
  const pill = quarter.status === "closed" ? <Badge tone="neutral">Closed</Badge>
    : d === null ? null
    : d < 0 ? <Badge tone="danger">Deadline passed</Badge>
    : <Badge tone={d <= 7 ? "danger" : d <= 14 ? "attention" : "soft"}>{d === 0 ? "Closes today" : `${d} ${d === 1 ? "Day" : "Days"} Remaining`}</Badge>;

  const Row = ({ label, value, warn }: { label: string; value: string; warn?: boolean }) => (
    <div className="flex items-center justify-between border-b border-dashed border-line py-3 text-[15px] last:border-0">
      <dt className="text-muted">{label}</dt><dd className={warn ? "font-semibold text-warning" : "font-semibold tabular-nums text-ink"}>{value}</dd>
    </div>
  );

  async function remind(o: { id: string; name: string }) {
    setBusy(o.id);
    const r = await remindOrg(o, quarter.id);
    setBusy(null);
    if (r !== "failed") setSent((s) => new Set(s).add(o.id));
  }
  async function sendBulk() {
    setBulkBusy(true);
    const ok = await remindAll(quarter.id);
    setBulkBusy(false);
    setBulk(false);
    if (ok) onDone();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-card border border-line bg-surface p-6">
        <h2 className="font-sans text-xl font-semibold text-ink">{quarter.name} Progress</h2>
        <div className="mt-5">
          <div className="flex items-center justify-between text-[15px]">
            <span className="text-muted">Submitted Orders</span>
            <span className="font-semibold tabular-nums text-ink">{progress.submitted} / {progress.target}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Organisations that have ordered">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <dl className="mt-4">
          <Row label="Awaiting Payment" value={`${progress.awaitingPayment} Orders`} />
          <Row label="Pending Processing" value={`${progress.toPrepare} Orders`} />
          <Row label="Ready for Pickup" value={`${progress.ready} Orders`} />
          {progress.refundsDue > 0 && <Row label="Refunds Due" value={`${progress.refundsDue} Orders`} warn />}
        </dl>
        {pill && (
          <div className="mt-4 flex items-center justify-between rounded-field bg-panel px-4 py-3.5">
            <span className="text-[15px] font-medium text-ink">Order Deadline</span>{pill}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 px-6 py-5">
          <h2 className="flex items-center gap-3 font-sans text-lg font-semibold text-ink"><Clock size={22} className="text-attention" aria-hidden /> Not Yet Ordered</h2>
          <span className="rounded-full bg-panel px-3 py-1 text-sm font-medium text-ink">{notOrdered.total} Orgs</span>
        </div>
        {notOrdered.preview.length === 0 ? (
          <p className="border-t border-line px-6 py-8 text-center text-[15px] text-muted">Every approved organisation has ordered.</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {notOrdered.preview.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-ink">{o.name}</p>
                  <p className="truncate text-sm text-muted">{cap(o.type)} • {o.email}</p>
                </div>
                <Button variant="outline" size="sm" loading={busy === o.id} disabled={!canRemind || sent.has(o.id)} onClick={() => remind(o)}>
                  {sent.has(o.id) ? "Sent" : "Remind"}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {notOrdered.total > notOrdered.preview.length && (
          <Link href={`/admin/reports?quarter=${quarter.id}`} className="block border-t border-line px-6 py-3 text-center text-sm font-medium text-primary hover:underline">
            See all {notOrdered.total}
          </Link>
        )}
        <button type="button" disabled={!canRemind || notOrdered.total === 0} onClick={() => setBulk(true)}
          className="flex w-full items-center justify-center gap-2 border-t border-line bg-primary-soft px-6 py-4 text-[15px] font-medium text-primary hover:bg-primary-softer disabled:cursor-not-allowed disabled:opacity-50">
          <Send size={16} aria-hidden /> Send Bulk Reminder ({notOrdered.total})
        </button>
      </section>

      <ConfirmDialog open={bulk} onClose={() => setBulk(false)} loading={bulkBusy} confirmLabel="Send reminders" onConfirm={sendBulk}
        title={`Remind ${notOrdered.total} ${notOrdered.total === 1 ? "organisation" : "organisations"}?`}
        description={`Each organisation that hasn't ordered gets an email reminding them to order before ${fmtDate(quarter.deadline_date)}. Anyone already reminded today, or past their own deadline, is skipped.`} />
    </div>
  );
}