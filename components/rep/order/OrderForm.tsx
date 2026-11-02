"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CategoryImage } from "@/components/rep/catalogue/CategoryImage";
import { api } from "@/lib/api";
import { orderFailure } from "@/lib/rep/orderActions";
import { useLiveRefresh } from "@/lib/useLiveRefresh";
import { notify } from "@/lib/notify";
import { fmtDate, kes } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { OrderLine } from "@/lib/rep/ordering";

const LIVE = ["orders"];
const MAX = 100_000;
const num = (v: string) => Number(v) || 0;
const capOf = (l: OrderLine) => (l.status === "available" ? MAX : Math.max(l.left ?? 0, l.qty));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Props = {
  mode: "place" | "edit"; orderId?: string; lines: OrderLine[]; orgType: string; quarterName: string; deadline: string;
  current?: { reference: string; total: number; paid: number };
};

export function OrderForm({ mode, orderId, lines, orgType, quarterName, deadline, current }: Props) {
  const router = useRouter();
  useLiveRefresh(LIVE); // stock changes live while you're on the page

  const initial = useMemo(() => Object.fromEntries(lines.map((l) => [l.slug, String(l.qty)])), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [qty, setQty] = useState<Record<string, string>>(initial);
  const [busy, setBusy] = useState(false);
  const leaving = useRef(false);

  // If stock drops while you're typing, pull quantities back to what's possible
  useEffect(() => {
    setQty((q) => {
      let changed = false;
      const next = { ...q };
      for (const l of lines) if (num(next[l.slug]) > capOf(l)) { next[l.slug] = String(capOf(l)); changed = true; }
      return changed ? next : q;
    });
  }, [lines]);

  const items = lines.reduce((n, l) => n + num(qty[l.slug]), 0);
  const total = lines.reduce((n, l) => n + num(qty[l.slug]) * l.price, 0);
  const dirty = lines.some((l) => qty[l.slug] !== initial[l.slug]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { if (!leaving.current) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (l: OrderLine, v: number) => setQty((q) => ({ ...q, [l.slug]: String(Math.min(Math.max(v, 0), capOf(l))) }));

  const paid = current?.paid ?? 0;
  const topUp = mode === "edit" && paid > 0 && total > paid ? total - paid : 0;
  const refund = mode === "edit" && paid > 0 && total < paid ? paid - total : 0;

  async function submit() {
    if (items === 0) { notify(mode === "place" ? "rep.order.empty" : "rep.order.empty_amend"); return; }
    setBusy(true);
    const quantities = Object.fromEntries(lines.map((l) => [l.slug, num(qty[l.slug])]));

    if (mode === "place") {
      const res = await api<{ data: { reference: string; total_amount_kes: number }; next: string }>("/api/orders", { json: { quantities }, silent: true });
      setBusy(false);
      if (!res.ok) { orderFailure(res); router.refresh(); return; }
      leaving.current = true;
      notify("rep.order.placed", { reference: res.data.data.reference, total: kes(res.data.data.total_amount_kes) });
      router.push(res.data.next);
      return;
    }

    const res = await api<{ data: { payment_adjustment: string; amount_due: number; refund_amount: number; new_total: number } }>(
      `/api/orders/${orderId}`, { method: "PATCH", json: { quantities }, silent: true });
    setBusy(false);
    if (!res.ok) { orderFailure(res); router.refresh(); return; }
    leaving.current = true;
    const r = res.data.data;
    if (r.payment_adjustment === "top_up_required") { notify("rep.order.amended_topup", { amount: kes(r.amount_due) }); router.push(`/rep/order/${orderId}/pay`); }
    else {
      notify(r.payment_adjustment === "refund_due" ? "rep.order.amended_refund" : "rep.order.amended",
        r.payment_adjustment === "refund_due" ? { amount: kes(r.refund_amount) } : { total: kes(r.new_total) });
      router.push("/rep/dashboard");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <section className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="border-b border-line bg-panel px-6 py-6 sm:px-8">
          <h2 className="font-sans text-lg font-semibold text-ink">Order Quantities</h2>
          <p className="mt-1 text-[15px] text-muted">Specify the number of units required for each category.</p>
        </div>
        <ul className="divide-y divide-line">
          {lines.map((l) => {
            const v = num(qty[l.slug]);
            const c = capOf(l);
            const out = c === 0;
            const atCap = l.status !== "available" && v >= c && c > 0;
            return (
              <li key={l.slug} className={cn("flex flex-wrap items-center gap-x-6 gap-y-4 px-6 py-5 sm:px-8", out && "bg-panel/40")}>
                <div className="flex min-w-[220px] flex-1 items-center gap-5">
                  <div className={cn("relative h-20 w-[60px] shrink-0 overflow-hidden rounded-md border border-line bg-panel", out && "opacity-60")}>
                    <CategoryImage slug={l.slug} alt="" muted={out} compact />
                  </div>
                  <div>
                    <p className={cn("text-base font-semibold", out ? "text-muted" : "text-ink")}>{l.name}</p>
                    <p className="text-[15px] text-muted">{kes(l.price)} per unit</p>
                    {l.status === "out" && (
                      <p className="mt-1 text-sm font-medium text-danger">{l.qty > 0 ? "Out of stock. You can keep or reduce your quantity." : "Out of stock"}</p>
                    )}
                    {l.status === "low" && l.left !== null && (
                      <p className="mt-1 text-sm font-medium text-attention">Low stock · {atCap ? "that's all that's left" : `only ${Math.max(l.left, l.qty)} left`}</p>
                    )}
                  </div>
                </div>

                <div className={cn("flex h-11 items-stretch overflow-hidden rounded-field border border-line bg-surface", out && v === 0 && "opacity-50")}>
                  <button type="button" aria-label={`Decrease ${l.name}`} disabled={v <= 0} onClick={() => set(l, v - 1)}
                    className="flex w-11 items-center justify-center bg-panel text-ink hover:bg-line disabled:cursor-not-allowed disabled:text-subtle disabled:hover:bg-panel"><Minus size={16} aria-hidden /></button>
                  <input inputMode="numeric" aria-label={`${l.name} quantity`} value={qty[l.slug]} disabled={out && v === 0}
                    onChange={(e) => set(l, num(e.target.value.replace(/\D/g, "").slice(0, 6)))}
                    onFocus={(e) => e.target.select()}
                    className="w-20 border-x border-line bg-surface text-center font-mono text-base font-medium text-ink outline-none focus:bg-primary-soft disabled:bg-transparent" />
                  <button type="button" aria-label={`Increase ${l.name}`} disabled={v >= c} onClick={() => set(l, v + 1)}
                    className="flex w-11 items-center justify-center bg-panel text-ink hover:bg-line disabled:cursor-not-allowed disabled:text-subtle disabled:hover:bg-panel"><Plus size={16} aria-hidden /></button>
                </div>

                <p className={cn("w-28 text-right font-mono text-base font-semibold", v > 0 ? "text-ink" : "text-muted")}>{kes(v * l.price)}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="rounded-card border border-line bg-surface p-6 sm:p-8 lg:sticky lg:top-24">
        <h2 className="border-b border-line pb-5 font-sans text-xl font-semibold text-ink">Order Summary</h2>
        <dl className="space-y-4 border-b border-line py-6 text-[15px]">
          <div className="flex justify-between"><dt className="text-muted">Total Items</dt><dd className="font-medium tabular-nums text-ink">{items.toLocaleString("en-KE")}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Quarter</dt><dd className="font-medium text-ink">{quarterName}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Organisation Type</dt><dd className="font-medium text-ink">{cap(orgType)}</dd></div>
        </dl>
        <div className="flex items-baseline justify-between py-6">
          <dt className="text-lg font-semibold text-ink">Estimated Total</dt>
          <dd className="font-mono text-2xl font-bold text-ink">{kes(total)}</dd>
        </div>

        {mode === "edit" && current && (
          <div className="mb-5 space-y-2 rounded-field bg-panel px-4 py-3.5 text-sm leading-relaxed">
            <p className="text-muted">Order <span className="font-mono text-ink">{current.reference}</span> · now <span className="font-mono text-ink">{kes(current.total)}</span>{paid > 0 && <> · paid <span className="font-mono text-ink">{kes(paid)}</span></>}</p>
            {topUp > 0 && <p className="font-medium text-warning">After saving you'll pay <span className="font-mono">{kes(topUp)}</span> more.</p>}
            {refund > 0 && <p className="font-medium text-primary"><span className="font-mono">{kes(refund)}</span> will be refunded by HHES finance.</p>}
          </div>
        )}

        <Button full loading={busy} disabled={items === 0 || (mode === "edit" && !dirty)} onClick={submit}>{mode === "place" ? "Submit Order" : "Save Changes"}</Button>
        {mode === "edit" && <Link href="/rep/dashboard" className="mt-3 block text-center text-[15px] font-medium text-muted hover:text-ink">Cancel</Link>}

        <p className="mt-5 flex gap-3 rounded-field bg-panel px-4 py-4 text-sm leading-relaxed text-muted">
          <Info size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
          <span>You can amend your quantities freely after submission, up until the closing deadline ({fmtDate(deadline)}) or until your items are packed.</span>
        </p>
      </aside>
    </div>
  );
}