"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarX, CircleCheck, CircleX, Clock, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Checkbox, Field, IconInput } from "@/components/ui/Field";
import { api } from "@/lib/api";
import { failKey, payFailure } from "@/lib/rep/payActions";
import { useLiveRefresh } from "@/lib/useLiveRefresh";
import { notify } from "@/lib/notify";
import { friendlyReason } from "@/lib/mpesa/messages";
import { normalizeKenyanPhone } from "@/lib/utils/phone";
import { fmtDate, fmtDayTime, kes, maskLocalPhone, toLocalPhone } from "@/lib/utils/format";
import { CATEGORIES } from "@/lib/admin/catalogue";
import { cn } from "@/lib/cn";
import type { PayOrder, PayTx } from "@/lib/rep/pay";

const LIVE = ["orders", "mpesa_transactions"];
const RESEND_AFTER = 90;     // seconds: matches the server's guard against double prompts
const CHECK_AFTER = 120;     // seconds before we ask Safaricom directly
const NAME = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

type View = "ready" | "waiting" | "review" | "failed" | "paid" | "closed" | "cancelled";

function derive(order: PayOrder, tx: PayTx[], state: string): View {
  const due = Math.max(Number(order.total_amount_kes) - Number(order.amount_paid_kes), 0);
  const latest = tx[0];
  if (order.status === "cancelled") return "cancelled";
  if (order.status !== "awaiting_payment") return "paid"; // paid, ready or collected
  if (due <= 0) return "paid";
  if (state !== "open") return "closed";
  if (latest?.status === "pending") return latest.needs_review ? "review" : "waiting";
  if (latest && (latest.status === "failed" || latest.status === "timeout")) return "failed";
  return "ready";
}

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  return now;
}

const Centered = ({ icon, tone, title, children }: { icon: ReactNode; tone: string; title: string; children: ReactNode }) => (
  <div className="flex flex-col items-center px-4 py-6 text-center">
    <span className={cn("flex size-16 items-center justify-center rounded-full", tone)}>{icon}</span>
    <h2 className="mt-6 font-sans text-2xl font-semibold text-ink">{title}</h2>
    <div className="mt-3 max-w-md text-base leading-relaxed text-muted">{children}</div>
  </div>
);

export function PayPanel({ order, tx, savedPhone, state, deadline }: {
  order: PayOrder; tx: PayTx[]; savedPhone: string | null; state: string; deadline: string | null;
}) {
  const router = useRouter();
  useLiveRefresh(LIVE);
  const now = useNow();

  const total = Number(order.total_amount_kes);
  const paid = Number(order.amount_paid_kes);
  const due = Math.max(total - paid, 0);
  const view = derive(order, tx, state);
  const latest = tx[0];
  const lastOk = tx.find((t) => t.status === "success");

  const [phone, setPhone] = useState(savedPhone ? toLocalPhone(savedPhone) : "");
  const [save, setSave] = useState(false);
  const [phoneErr, setPhoneErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [changeNumber, setChangeNumber] = useState(false);

  const normalized = normalizeKenyanPhone(phone);
  const differs = !!savedPhone && !!normalized && normalized !== savedPhone;
  const sinceSent = latest && now ? Math.floor((now - Date.parse(latest.created_at)) / 1000) : null;

  // Tell the user what happened when a payment resolves while they're watching
  const prev = useRef<View>(view);
  useEffect(() => {
    if (prev.current === "waiting" && view === "paid" && lastOk) notify("rep.pay.success", { amount: kes(lastOk.amount_kes), receipt: lastOk.mpesa_receipt_number ?? "-" });
    if (prev.current === "waiting" && view === "failed" && latest) {
      const k = failKey(latest.result_code);
      notify(k, k === "rep.pay.failed.generic" ? { reason: friendlyReason(latest.result_code ?? undefined, latest.result_desc ?? undefined) } : undefined);
    }
    if (prev.current !== view) setChangeNumber(false);
    prev.current = view;
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  // While waiting: poll as a fallback, and after 2 minutes ask Safaricom directly
  useEffect(() => {
    if (view !== "waiting") return;
    const poll = setInterval(() => router.refresh(), 6000);
    const check = setInterval(async () => {
      if (!latest || Date.now() - Date.parse(latest.created_at) < CHECK_AFTER * 1000) return;
      await api("/api/payments/check", { json: { order_id: order.id }, silent: true });
      router.refresh();
    }, 30_000);
    return () => { clearInterval(poll); clearInterval(check); };
  }, [view, latest?.id, order.id, router]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(useNumber?: string) {
    const typed = useNumber ?? phone;
    if (!typed.trim()) { setPhoneErr("Enter the number to pay with"); notify("rep.pay.phone_required"); return; }
    if (!normalizeKenyanPhone(typed)) { setPhoneErr("Use a Safaricom number like 0712 345 678"); notify("rep.pay.phone_invalid"); return; }
    setPhoneErr(undefined);
    setBusy(true);
    const res = await api<{ amount: number }>("/api/payments/stkpush", {
      json: { order_id: order.id, phone: typed.trim(), ...(save && differs ? { save_phone: true } : {}) }, silent: true });
    setBusy(false);
    if (res.ok) { notify("rep.pay.prompt_sent", { amount: kes(res.data.amount) }); setChangeNumber(false); router.refresh(); return; }
    if (res.fields?.phone) setPhoneErr("Use a Safaricom number like 0712 345 678");
    payFailure(res);
    router.refresh();
  }

  const form = (label: string, action: string) => (
    <div>
      <Field label="M-Pesa phone number" htmlFor="pay-phone" error={phoneErr} hint="We'll send a payment prompt to this Safaricom number.">
        <IconInput id="pay-phone" icon={Smartphone} type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={phone}
          onChange={(e) => { setPhone(e.target.value); setPhoneErr(undefined); }} aria-invalid={!!phoneErr} />
      </Field>
      {differs && <div className="mt-4"><Checkbox checked={save} onChange={(e) => setSave(e.target.checked)} label="Use this number for future payments" /></div>}
      <Button full className="mt-6" loading={busy} onClick={() => send()}><Smartphone size={18} aria-hidden /> {action}</Button>
      <p className="sr-only">{label}</p>
    </div>
  );

  let body: ReactNode;
  if (view === "ready") {
    body = (
      <>
        <div className="rounded-field bg-panel px-6 py-6 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.1em] text-muted">Amount to pay</p>
          <p className="mt-2 font-mono text-4xl font-bold text-ink">{kes(due)}</p>
          {paid > 0 && <p className="mt-2 text-sm text-muted">You've already paid <span className="font-mono text-ink">{kes(paid)}</span>. This is the balance.</p>}
        </div>
        <div className="mt-6">{form("Send payment request", "Send payment request")}</div>
        <ol className="mt-8 space-y-3 text-[15px] text-muted">
          {["Press Send payment request.", "A pop-up from M-Pesa appears on your phone.", "Enter your M-Pesa PIN to approve. We never see it."].map((s, i) => (
            <li key={s} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{i + 1}</span>{s}</li>
          ))}
        </ol>
        <p className="mt-8 border-t border-line pt-5 text-center text-[15px] text-muted">
          Not ready? <Link href="/rep/dashboard" className="font-medium text-primary hover:underline">Pay later</Link>. Your order is saved and waits for payment until {deadline ? fmtDate(deadline) : "the deadline"}.
        </p>
      </>
    );
  } else if (view === "waiting") {
    const left = Math.max(RESEND_AFTER - (sinceSent ?? 0), 0);
    const mm = sinceSent === null ? "" : `${Math.floor(sinceSent / 60)}:${String(sinceSent % 60).padStart(2, "0")}`;
    body = (
      <>
        <Centered tone="bg-primary-soft text-primary" title="Check your phone"
          icon={<span className="relative flex size-16 items-center justify-center"><span className="absolute inset-0 animate-ping rounded-full bg-primary/20" /><Smartphone size={28} className="relative" aria-hidden /></span>}>
          <p>We sent a payment request for <strong className="font-mono font-semibold text-ink">{kes(latest!.amount_kes)}</strong> to <strong className="font-mono font-semibold text-ink">{maskLocalPhone(latest!.phone_number)}</strong>. Enter your M-Pesa PIN to approve it.</p>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm"><Loader2 size={16} className="animate-spin" aria-hidden /> Waiting for payment{mm && <span className="font-mono">· {mm}</span>}</p>
          {sinceSent !== null && sinceSent > 120 && <p className="mt-3 text-sm">This is taking longer than usual. We're checking with M-Pesa and will update this page.</p>}
        </Centered>
        {sinceSent !== null && sinceSent > 30 && (
          <div className="mt-6 border-t border-line pt-6">
            <p className="text-center text-[15px] text-muted">No prompt? Make sure the phone is on and has network.</p>
            {changeNumber ? <div className="mt-5">{form("Send payment request", "Send to this number")}</div> : (
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Button variant="outline" loading={busy} disabled={left > 0} onClick={() => send(toLocalPhone(latest!.phone_number))}>{left > 0 ? `Resend in ${left}s` : "Resend request"}</Button>
                <Button variant="ghost" disabled={left > 0} onClick={() => setChangeNumber(true)}>Use a different number</Button>
              </div>
            )}
          </div>
        )}
      </>
    );
  } else if (view === "failed") {
    const reason = friendlyReason(latest!.result_code ?? undefined, latest!.result_desc ?? undefined);
    body = (
      <>
        <Centered tone="bg-danger-soft text-danger" title="Payment not completed" icon={<CircleX size={30} aria-hidden />}>
          <p>{reason}</p><p className="mt-2">Your order is saved. You owe <strong className="font-mono font-semibold text-ink">{kes(due)}</strong>.</p>
        </Centered>
        <div className="mt-6 border-t border-line pt-6">
          {changeNumber ? form("Send payment request", "Send to this number") : (
            <div className="flex flex-wrap justify-center gap-3">
              <Button loading={busy} onClick={() => send(toLocalPhone(latest!.phone_number))}>Retry payment</Button>
              <Button variant="outline" onClick={() => setChangeNumber(true)}>Use a different number</Button>
            </div>
          )}
        </div>
      </>
    );
  } else if (view === "review") {
    body = (
      <Centered tone="bg-warning-soft text-warning" title="We're confirming your payment" icon={<Clock size={30} aria-hidden />}>
        <p>M-Pesa hasn't confirmed this payment automatically yet. HHES is checking it. <strong className="font-medium text-ink">You don't need to pay again.</strong> We'll email you as soon as it's confirmed.</p>
        <div className="mt-6 flex justify-center"><Link href="/rep/dashboard" className={buttonStyles({ variant: "outline" })}>Back to dashboard</Link></div>
      </Centered>
    );
  } else if (view === "paid") {
    body = (
      <Centered tone="bg-success-soft text-success" title="Payment received" icon={<CircleCheck size={32} aria-hidden />}>
        <p>Thank you. Your order is fully paid. We'll email you when it's ready for pickup.</p>
        {lastOk && (
          <dl className="mx-auto mt-6 w-full max-w-sm space-y-2 rounded-field bg-panel px-5 py-4 text-left text-[15px]">
            <div className="flex justify-between gap-4"><dt className="text-muted">Amount</dt><dd className="font-mono text-ink">{kes(lastOk.amount_kes)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">M-Pesa receipt</dt><dd className="font-mono font-semibold text-ink">{lastOk.mpesa_receipt_number ?? "-"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Time</dt><dd className="text-ink" suppressHydrationWarning>{fmtDayTime(lastOk.transaction_date ?? lastOk.created_at)}</dd></div>
          </dl>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/rep/orders?order=${order.id}`} className={buttonStyles()}>View my order</Link>
          <Link href="/rep/dashboard" className={buttonStyles({ variant: "outline" })}>Back to dashboard</Link>
        </div>
      </Centered>
    );
  } else {
    const cancelled = view === "cancelled";
    body = (
      <Centered tone="bg-panel text-muted" title={cancelled ? "This order was cancelled" : "The payment window has closed"} icon={<CalendarX size={30} aria-hidden />}>
        <p>{cancelled ? "There's nothing to pay." : "The ordering deadline passed before this order was paid. Contact HHES if you still need these books."}</p>
        <div className="mt-6 flex justify-center"><Link href="/rep/dashboard" className={buttonStyles({ variant: "outline" })}>Back to dashboard</Link></div>
      </Centered>
    );
  }

  const items = order.order_items.filter((i) => i.quantity > 0);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <section className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex items-center gap-4 border-b border-line px-6 py-6 sm:px-8">
          <span className="flex size-11 items-center justify-center rounded-field bg-positive text-white"><Smartphone size={22} aria-hidden /></span>
          <div>
            <h2 className="font-sans text-lg font-semibold text-ink">Pay with M-Pesa</h2>
            <p className="text-[15px] text-muted">Order <span className="font-mono text-ink">{order.reference}</span>{order.quarters && ` · ${order.quarters.name}`}</p>
          </div>
        </div>
        <div className="px-6 py-8 sm:px-10" aria-live="polite">{body}</div>
      </section>

      <aside className="rounded-card border border-line bg-surface p-6 sm:p-8 lg:sticky lg:top-24">
        <h2 className="border-b border-line pb-5 font-sans text-xl font-semibold text-ink">Order Summary</h2>
        <ul className="space-y-3 border-b border-line py-6 text-[15px]">
          {items.map((i) => (
            <li key={i.category_slug} className="flex justify-between gap-4">
              <span className="text-ink">{NAME[i.category_slug] ?? i.category_slug} <span className="text-muted">× {i.quantity}</span></span>
              <span className="font-mono text-ink">{kes(i.quantity * Number(i.unit_price_kes))}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-3 py-6 text-[15px]">
          <div className="flex justify-between"><dt className="text-muted">Order total</dt><dd className="font-mono text-ink">{kes(total)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Paid so far</dt><dd className="font-mono text-ink">{kes(paid)}</dd></div>
          <div className="flex items-baseline justify-between border-t border-line pt-4"><dt className="text-lg font-semibold text-ink">Amount due</dt><dd className="font-mono text-2xl font-bold text-ink">{kes(due)}</dd></div>
        </dl>
        <p className="flex gap-3 rounded-field bg-panel px-4 py-4 text-sm leading-relaxed text-muted">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
          <span>Payments go through Safaricom M-Pesa. You approve them with your PIN on your own phone. HHES never sees or asks for your PIN.</span>
        </p>
      </aside>
    </div>
  );
}