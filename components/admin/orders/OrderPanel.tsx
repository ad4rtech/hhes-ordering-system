"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { OrderStatusBadge, PaymentStatusBadge, TypeBadge } from "@/components/admin/StatusBadges";
import { ResolveDialog, type ResolveTarget } from "./ResolveDialog";
import { api } from "@/lib/api";
import { notify } from "@/lib/notify";
import { markOrder, processRefund } from "@/lib/admin/orderActions";
import { CATEGORIES } from "@/lib/admin/catalogue";
import { fmtStamp, kes, maskPhone } from "@/lib/utils/format";
import type { OrderDetail } from "@/lib/admin/orders";

const NAME: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));
const STEP: Record<string, string> = {
  awaiting_payment: "Order placed, awaiting payment", paid: "Payment received", ready_for_pickup: "Marked ready for pickup",
  collected: "Collected", cancelled: "Cancelled",
};
const ADJUST: Record<string, string> = { top_up_required: "Top-up required", refund_due: "Refund due", none: "No payment change" };

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-b border-line py-6 first:pt-0 last:border-0">
    <h3 className="mb-4 font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">{title}</h3>
    {children}
  </section>
);
const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-muted">{children}</p>;

export function OrderPanel({ orderId, onClose, onChanged }: { orderId: string | null; onClose: () => void; onChanged: () => void }) {
  const [o, setO] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"collect" | "refund" | null>(null);
  const [resolve, setResolve] = useState<ResolveTarget | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    const res = await api<{ data: OrderDetail }>(`/api/orders/${id}`, { silent: true });
    setLoading(false);
    if (res.ok) setO(res.data.data);
    else { notify("admin.order.load_failed"); onClose(); }
  }, [onClose]);

  useEffect(() => { setO(null); if (orderId) load(orderId); }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const ref = o ? { id: o.id, reference: o.reference, org: o.organisations?.name ?? "The organisation" } : null;
  async function act(fn: () => Promise<boolean>) {
    setBusy(true);
    const ok = await fn();
    setBusy(false);
    setConfirm(null);
    if (ok && o) { await load(o.id); onChanged(); }
  }

  const items = o?.order_items.filter((i) => i.quantity > 0) ?? [];
  const history = [...(o?.order_status_history ?? [])].sort((a, b) => a.changed_at.localeCompare(b.changed_at));
  const amendments = [...(o?.order_amendments ?? [])].sort((a, b) => b.amended_at.localeCompare(a.amended_at));
  const tx = [...(o?.mpesa_transactions ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const due = o ? Math.max(Number(o.total_amount_kes) - Number(o.amount_paid_kes), 0) : 0;
  const locked = !o || o.is_historical || o.status === "cancelled" || o.status === "collected";

  const footer = o && (
    <>
      {o.refund_due && <Button variant="outline" disabled={busy} onClick={() => setConfirm("refund")}>Mark refund processed</Button>}
      {!locked && o.status === "awaiting_payment" && <Button disabled title="Waiting for M-Pesa payment">Mark Ready for Pickup</Button>}
      {!locked && o.status === "paid" && <Button loading={busy} onClick={() => act(() => markOrder(ref!, "ready_for_pickup"))}>Mark Ready for Pickup</Button>}
      {!locked && o.status === "ready_for_pickup" && <Button variant="positive" disabled={busy} onClick={() => setConfirm("collect")}>Mark Collected</Button>}
    </>
  );

  return (
    <>
      <Dialog side open={!!orderId} onClose={onClose}
        title={o ? <span className="font-mono">{o.reference}</span> : "Order"}
        description={o && <span className="mt-2 flex flex-wrap items-center gap-2"><OrderStatusBadge status={o.status} />{!o.is_historical && <PaymentStatusBadge status={o.payment_status} />}{o.refund_due && <Badge tone="dangerSoft">Refund due {kes(o.refund_amount_kes)}</Badge>}{o.is_historical && <Badge tone="neutral">Imported</Badge>}</span>}
        footer={o && !o.refund_due && locked ? undefined : footer}>
        {loading || !o ? (
          <div className="space-y-4" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-field bg-canvas" />)}</div>
        ) : (
          <>
            <Section title="Organisation">
              <p className="flex flex-wrap items-center gap-2 text-[15px] font-medium text-ink">{o.organisations?.name} {o.organisations && <TypeBadge type={o.organisations.type} />}</p>
              <p className="mt-1 text-sm text-muted">{o.organisations?.contact_name} · {o.organisations?.contact_email}</p>
              <p className="mt-3 text-sm text-muted">{o.quarters?.name} · Placed {o.submitted_at ? fmtStamp(o.submitted_at) : "-"}{o.collected_at && <> · Collected {fmtStamp(o.collected_at)}</>}</p>
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
              <dl className="grid grid-cols-3 gap-3 text-sm">
                {[["Total", kes(o.total_amount_kes)], ["Paid", kes(o.amount_paid_kes)], [o.refund_due ? "Refund due" : "Balance", kes(o.refund_due ? o.refund_amount_kes : due)]].map(([k, v]) => (
                  <div key={k} className="rounded-field bg-panel p-3"><dt className="text-muted">{k}</dt><dd className="mt-1 font-mono text-[15px] font-semibold text-ink">{v}</dd></div>
                ))}
              </dl>
              {tx.length === 0 ? <div className="mt-4"><Empty>{o.is_historical ? "Imported order, paid in cash before the system." : "No M-Pesa attempts yet."}</Empty></div> : (
                <ul className="mt-4 space-y-2">
                  {tx.map((t) => (
                    <li key={t.id} className="rounded-field border border-line p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[15px] text-ink">{t.mpesa_receipt_number ?? "No receipt"}</p>
                          <p className="text-sm text-muted">{maskPhone(t.phone_number)} · {fmtStamp(t.transaction_date ?? t.created_at)}</p>
                          {t.result_desc && t.status !== "success" && <p className="mt-1 text-sm text-muted">{t.result_desc}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1.5"><span className="font-mono text-[15px] text-ink">{kes(t.amount_kes)}</span><PaymentStatusBadge status={t.status} /></div>
                      </div>
                      {t.needs_review && t.status === "pending" && (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-field bg-warning-soft px-3 py-2.5">
                          <p className="text-sm text-warning">This payment needs review.</p>
                          <Button size="sm" variant="outline" onClick={() => setResolve({ id: t.id, org: ref!.org, reference: o.reference, amount: Number(t.amount_kes), note: t.review_note })}>Resolve</Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Status timeline">
              {history.length === 0 ? <Empty>No history yet.</Empty> : (
                <ol className="space-y-4 border-l border-line pl-5">
                  {history.map((h, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[26px] top-1.5 size-2.5 rounded-full bg-primary" aria-hidden />
                      <p className="text-[15px] text-ink">{STEP[h.to_status] ?? h.to_status}</p>
                      <p className="text-sm text-muted">{fmtStamp(h.changed_at)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </Section>

            <Section title="Amendments">
              {amendments.length === 0 ? <Empty>This order hasn't been amended.</Empty> : (
                <ul className="space-y-3">
                  {amendments.map((a) => {
                    const slugs = Object.keys({ ...a.previous_data.items, ...a.new_data.items }).filter((s) => (a.previous_data.items[s] ?? 0) !== (a.new_data.items[s] ?? 0));
                    return (
                      <li key={a.id} className="rounded-field border border-line p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-muted">{fmtStamp(a.amended_at)}</p>
                          {a.payment_adjustment && a.payment_adjustment !== "none" && <Badge tone={a.payment_adjustment === "refund_due" ? "dangerSoft" : "warning"}>{ADJUST[a.payment_adjustment]}</Badge>}
                        </div>
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

      <ConfirmDialog open={confirm === "collect"} onClose={() => setConfirm(null)} loading={busy} confirmLabel="Mark collected"
        title={`Mark ${o?.reference ?? ""} as collected?`}
        description="Confirm the organisation has picked up its books. The order is locked afterwards and they receive a pickup confirmation email."
        onConfirm={() => act(() => markOrder(ref!, "collected"))} />
      <ConfirmDialog open={confirm === "refund"} onClose={() => setConfirm(null)} loading={busy} confirmLabel="Mark refund processed"
        title={`Refund ${o ? kes(o.refund_amount_kes) : ""}?`}
        description="Confirm HHES finance has already refunded this amount to the organisation through the Safaricom portal. The system doesn't send the money."
        onConfirm={() => act(() => processRefund(ref!))} />
      <ResolveDialog tx={resolve} onClose={() => setResolve(null)} onDone={() => { setResolve(null); if (o) { load(o.id); onChanged(); } }} />
    </>
  );
}