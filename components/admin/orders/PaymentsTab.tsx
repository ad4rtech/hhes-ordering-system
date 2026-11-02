"use client";

import { useState, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { PaymentStatusBadge } from "@/components/admin/StatusBadges";
import { ResolveDialog, type ResolveTarget } from "./ResolveDialog";
import { useUrlParams } from "@/lib/useUrlParams";
import { fmtStamp, kes, maskPhone } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { OQuarter } from "@/lib/admin/orders";
import type { PaymentRow, PaymentsData } from "@/lib/admin/payments";

const STATUS_OPTIONS = [["", "All"], ["success", "Successful"], ["failed", "Failed or timed out"], ["pending", "Pending"]] as const;
const TH = "px-6 py-4 text-[15px] font-medium text-muted";

const Tile = ({ label, value, mono, tone }: { label: string; value: ReactNode; mono?: boolean; tone?: string }) => (
  <div className="rounded-card border border-line bg-surface p-5">
    <dt className="text-[15px] text-muted">{label}</dt>
    <dd className={cn("mt-2 text-2xl font-bold text-ink", mono && "font-mono", tone)}>{value}</dd>
  </div>
);

export function PaymentsTab({ quarters, selected, data, status }: { quarters: OQuarter[]; selected: OQuarter; data: PaymentsData; status: string }) {
  const { update, refresh, isPending } = useUrlParams();
  const [resolve, setResolve] = useState<ResolveTarget | null>(null);
  const { rows, count, page, pageSize, review, summary } = data;
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);
  const target = (t: PaymentRow): ResolveTarget => ({ id: t.id, org: t.orders.organisations.name, reference: t.orders.reference, amount: Number(t.amount_kes), note: t.review_note });

  return (
    <div className="space-y-6">
      <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Collected via M-Pesa" value={kes(summary.successKes)} mono />
        <Tile label="Successful payments" value={summary.successCount} />
        <Tile label="Failed or timed out" value={summary.failedCount} />
        <Tile label="Needs review" value={summary.reviewCount} tone={summary.reviewCount ? "text-danger-solid" : undefined} />
      </dl>

      {review.length > 0 && (
        <section className="overflow-hidden rounded-card border border-warning/30 bg-surface">
          <div className="flex items-start gap-3 bg-warning-soft px-6 py-5">
            <TriangleAlert size={22} className="mt-0.5 shrink-0 text-warning" aria-hidden />
            <div>
              <h2 className="font-sans text-lg font-semibold text-ink">Payments that need review</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">Safaricom didn't confirm these automatically. Check each against the Paybill statement and confirm or mark it failed.</p>
            </div>
          </div>
          <ul className="divide-y divide-line">
            {review.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-[15px] font-medium text-ink">{t.orders.organisations.name} <span className="font-mono text-sm text-muted">{t.orders.reference}</span></p>
                  <p className="text-sm text-muted">{kes(t.amount_kes)} · {maskPhone(t.phone_number)} · {fmtStamp(t.created_at)}</p>
                  {t.review_note && <p className="mt-1 text-sm text-warning">{t.review_note}</p>}
                </div>
                <Button size="sm" onClick={() => setResolve(target(t))}>Resolve</Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <h2 className="font-sans text-lg font-semibold text-ink">Reconciliation</h2>
          <div className="flex flex-wrap gap-3">
            <FilterSelect label="Status" value={status} options={STATUS_OPTIONS} onChange={(v) => update({ status: v || undefined, page: undefined })} />
            <FilterSelect label="Quarter" value={selected.id} options={quarters.map((x) => [x.id, x.name] as const)} onChange={(v) => update({ quarter: v, page: undefined })} />
          </div>
        </div>
        <div className={cn("overflow-x-auto border-t border-line transition-opacity", isPending && "opacity-60")}>
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-panel">
              <tr><th className={TH}>Date</th><th className={TH}>Organisation</th><th className={TH}>Order</th><th className={TH}>M-Pesa Receipt</th><th className={`${TH} text-right`}>Amount</th><th className={TH}>Status</th><th className={TH}>Phone</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-14 text-center text-muted">No M-Pesa transactions for this quarter yet.</td></tr>
              ) : rows.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-ink">{fmtStamp(t.transaction_date ?? t.created_at)}</td>
                  <td className="px-6 py-4 text-[15px] font-medium text-ink">{t.orders.organisations.name}</td>
                  <td className="px-6 py-4 font-mono text-sm text-ink">{t.orders.reference}</td>
                  <td className="px-6 py-4 font-mono text-[15px] text-ink">{t.mpesa_receipt_number ?? <span className="text-muted">-</span>}</td>
                  <td className="px-6 py-4 text-right font-mono text-[15px] text-ink">{kes(t.amount_kes)}</td>
                  <td className="px-6 py-4"><div className="flex flex-wrap gap-1.5"><PaymentStatusBadge status={t.status} />{t.needs_review && t.status === "pending" && <Badge tone="warning">Needs review</Badge>}</div></td>
                  <td className="px-6 py-4 font-mono text-sm text-muted">{maskPhone(t.phone_number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-4">
          <p className="text-[15px] text-muted">Showing {from}-{to} of {count.toLocaleString("en-KE")} transactions</p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => update({ page: String(page - 1) })}>Previous</Button>
            <Button variant="outline" size="sm" disabled={to >= count || isPending} onClick={() => update({ page: String(page + 1) })}>Next</Button>
          </div>
        </div>
      </section>

      <ResolveDialog tx={resolve} onClose={() => setResolve(null)} onDone={() => { setResolve(null); refresh(); }} />
    </div>
  );
}