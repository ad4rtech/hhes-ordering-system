"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { RepStatusBadge } from "@/components/rep/StatusBadge";
import { PaymentStatusBadge } from "@/components/admin/StatusBadges";
import { CATEGORIES } from "@/lib/admin/catalogue";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/notify";
import { fmtDayTime, kes, maskLocalPhone } from "@/lib/utils/format";

const NAME: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));
const STEP: Record<string, string> = {
  awaiting_payment: "Order placed, waiting for payment", paid: "Payment received", ready_for_pickup: "Ready for pickup",
  collected: "Collected", cancelled: "Cancelled",
};

type Detail = {
  id: string; reference: string; status: string; payment_status: string; total_amount_kes: number; amount_paid_kes: number;
  refund_due: boolean; refund_amount_kes: number; is_historical: boolean; submitted_at: string | null; collected_at: string | null; quarter_id: string;
  quarters: { name: string } | null;
  order_items: { category_slug: string; quantity: number; unit_price_kes: number }[];
  order_amendments: { id: string; previous_data: { items: Record<string, number>; total_amount_kes: number }; new_data: { items: Record<string, number>; total_amount_kes: number }; payment_adjustment: string | null; amended_at: string }[];
  order_status_history: { to_status: string; changed_at: string }[];
  mpesa_transactions: { id: string; amount_kes: number; status: string; mpesa_receipt_number: string | null; transaction_date: string | null; created_at: string; phone_number: string; needs_review: boolean }[];
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-b border-line py-6 first:pt-0 last:border-0">
    <h3 className="mb-4 font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">{title}</h3>
    {children}
  </section>
);
const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-muted">{children}</p>;

export function MyOrderPanel({ orderId, windowState, currentQuarterId, pickup, onClose, onCancel }: {
  orderId: string | null; windowState: string; currentQuarterId: string | null; pickup: { address: string; hours: string };
  onClose: () => void; onCancel: (o: { id: string; reference: string; paid: number; status: string }) => void;
}) {
  const [o, setO] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    const { data, error } = await createClient().from("orders").select(`
      id,reference,status,payment_status,total_amount_kes,amount_paid_kes,refund_due,refund_amount_kes,is_historical,submitted_at,collected_at,quarter_id,
      quarters(name),
      order_items(category_slug,quantity,unit_price_kes),
      order_amendments(id,previous_data,new_data,payment_adjustment,amended_at),
      order_status_history(to_status,changed_at),
      mpesa_transactions(id,amount_kes,status,mpesa_receipt_number,transaction_date,created_at,phone_number,needs_review)
    `).eq("id", id).maybeSingle();
    setLoading(false);
    if (error || !data) { notify("rep.order.load_failed"); onClose(); return; }
    setO(data as unknown as Detail);
  }, [onClose]);

  useEffect(() => { setO(null); if (orderId) load(orderId); }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = o?.order_items.filter((i) => i.quantity > 0) ?? [];
  const history = [...(o?.order_status_history ?? [])].sort((a, b) => a.changed_at.localeCompare(b.changed_at));
  const amendments = [...(o?.order_amendments ?? [])].sort((a, b) => b.amended_at.localeCompare(a.amended_at));
  const tx = [...(o?.mpesa_transactions ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const due = o ? Math.max(Number(o.total_amount_kes) - Number(o.amount_paid_kes), 0) : 0;

  const live = !!o && o.quarter_id === currentQuarterId && windowState === "open";
  const payable = !!o && live && o.status === "awaiting_payment";
  const amendable = !!o && live && (o.status === "awaiting_payment" || o.status === "paid");
  const cancellable = !!o && !o.is_historical && ["awaiting_payment", "paid", "ready_for_pickup"].includes(o.status);
  const showPickup = !!o && (o.status === "ready_for_pickup" || o.status === "paid");

  const footer = o && (payable || amendable || cancellable) ? (
    <>
      {cancellable && <Button variant="dangerOutline" onClick={() => onCancel({ id: o.id, reference: o.reference, paid: Number(o.amount_paid_kes), status: o.status })}>Cancel order</Button>}
      {amendable && <Link href={`/rep/order/${o.id}/edit`} className={buttonStyles({ variant: "outline" })}>Edit order</Link>}
      {payable && <Link href={`/rep/order/${o.id}/pay`} className={buttonStyles()}>Pay now</Link>}
    </>
  ) : undefined;

  return (
    <Dialog side open={!!orderId} onClose={onClose}
      title={o ? <span className="font-mono">{o.reference}</span> : "Order"}
      description={o && <span className="mt-2 flex flex-wrap items-center gap-2"><RepStatusBadge size="sm" status={o.status} payment={o.payment_status} />{o.is_historical && <Badge tone="neutral">Imported</Badge>}</span>}
      footer={footer}>
      {loading || !o ? (
        <div className="space-y-4" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-field bg-canvas" />)}</div>
      ) : (
        <>
          <Section title="Summary">
            <p className="text-[15px] font-medium text-ink">{o.quarters?.name} order</p>
            <p className="mt-1 text-sm text-muted" suppressHydrationWarning>
              Placed {o.submitted_at ? fmtDayTime(o.submitted_at) : "-"}{o.collected_at && <> · Collected {fmtDayTime(o.collected_at)}</>}
            </p>
            {showPickup && (
              <p className="mt-3 rounded-field bg-panel px-4 py-3 text-sm leading-relaxed text-muted">
                <strong className="font-medium text-ink">Pickup:</strong> {pickup.address}{pickup.hours && <> · {pickup.hours}</>}
              </p>
            )}
          </Section>

          <Section title="Items">
            <div className="overflow-hidden rounded-field border border-line">
              <table className="w-full text-left text-[15px]">
                <tbody className="divide-y divide-line">
                  {items.map((i) => (
                    <tr key={i.category_slug}>
                      <td className="px-4 py-3 text-ink">{NAME[i.category_slug] ?? i.category_slug}</td>
                      <td className="px-4 py-3 text-right text-muted">{i.quantity} × <span className="font-mono">{kes(i.unit_price_kes)}</span></td>
                      <td className="px-4 py-3 text-right font-mono text-ink">{kes(i.quantity * Number(i.unit_price_kes))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-panel"><td className="px-4 py-3 font-semibold text-ink" colSpan={2}>Total · {items.reduce((n, i) => n + i.quantity, 0)} units</td><td className="px-4 py-3 text-right font-mono font-semibold text-ink">{kes(o.total_amount_kes)}</td></tr></tfoot>
              </table>
            </div>
          </Section>

          <Section title="Payment">
            {o.is_historical ? <Empty>Imported from HHES's earlier records. Paid before the online system.</Empty> : (
              <>
                <dl className="grid grid-cols-3 gap-3 text-sm">
                  {[["Total", kes(o.total_amount_kes)], ["Paid", kes(o.amount_paid_kes)], [o.refund_due ? "Refund due" : "Balance", kes(o.refund_due ? o.refund_amount_kes : o.status === "cancelled" ? 0 : due)]].map(([k, v]) => (
                    <div key={k} className="rounded-field bg-panel p-3"><dt className="text-muted">{k}</dt><dd className="mt-1 font-mono text-[15px] font-semibold text-ink">{v}</dd></div>
                  ))}
                </dl>
                {tx.length === 0 ? <div className="mt-4"><Empty>No M-Pesa payments yet.</Empty></div> : (
                  <ul className="mt-4 space-y-2">
                    {tx.map((t) => (
                      <li key={t.id} className="flex items-start justify-between gap-3 rounded-field border border-line p-3">
                        <div>
                          <p className="font-mono text-[15px] text-ink">{t.mpesa_receipt_number ?? "No receipt"}</p>
                          <p className="text-sm text-muted" suppressHydrationWarning>{maskLocalPhone(t.phone_number)} · {fmtDayTime(t.transaction_date ?? t.created_at)}</p>
                          {t.needs_review && t.status === "pending" && <p className="mt-1 text-sm text-warning">HHES is confirming this payment.</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1.5"><span className="font-mono text-[15px] text-ink">{kes(t.amount_kes)}</span><PaymentStatusBadge status={t.status} /></div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Section>

          <Section title="Progress">
            {history.length === 0 ? <Empty>No history yet.</Empty> : (
              <ol className="space-y-4 border-l border-line pl-5">
                {history.map((h, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[26px] top-1.5 size-2.5 rounded-full bg-primary" aria-hidden />
                    <p className="text-[15px] text-ink">{STEP[h.to_status] ?? h.to_status}</p>
                    <p className="text-sm text-muted" suppressHydrationWarning>{fmtDayTime(h.changed_at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section title="Changes you made">
            {amendments.length === 0 ? <Empty>You haven't changed this order.</Empty> : (
              <ul className="space-y-3">
                {amendments.map((a) => {
                  const slugs = Object.keys({ ...a.previous_data.items, ...a.new_data.items }).filter((s) => (a.previous_data.items[s] ?? 0) !== (a.new_data.items[s] ?? 0));
                  return (
                    <li key={a.id} className="rounded-field border border-line p-4">
                      <p className="text-sm text-muted" suppressHydrationWarning>{fmtDayTime(a.amended_at)}</p>
                      <p className="mt-2 text-[15px] text-ink">Total <span className="font-mono">{kes(a.previous_data.total_amount_kes)}</span> → <span className="font-mono font-semibold">{kes(a.new_data.total_amount_kes)}</span></p>
                      <ul className="mt-1 text-sm text-muted">{slugs.map((s) => <li key={s}>{NAME[s] ?? s}: {a.previous_data.items[s] ?? 0} → {a.new_data.items[s] ?? 0}</li>)}</ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </>
      )}
    </Dialog>
  );
}