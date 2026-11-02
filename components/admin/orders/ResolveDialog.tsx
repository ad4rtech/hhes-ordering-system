"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { resolvePayment } from "@/lib/admin/paymentActions";
import { notify } from "@/lib/notify";
import { kes } from "@/lib/utils/format";
import { cn } from "@/lib/cn";

export type ResolveTarget = { id: string; org: string; reference: string; amount: number; note?: string | null };

export function ResolveDialog({ tx, onClose, onDone }: { tx: ResolveTarget | null; onClose: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<"confirm" | "fail">("confirm");
  const [receipt, setReceipt] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ receipt?: string; amount?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { setMode("confirm"); setReceipt(""); setAmount(tx ? String(tx.amount) : ""); setNote(""); setErrors({}); }, [tx?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    if (!tx) return;
    if (mode === "confirm") {
      const e: typeof errors = {};
      const r = receipt.trim().toUpperCase();
      if (!/^[A-Z0-9]{10}$/.test(r)) e.receipt = "M-Pesa receipts are 10 letters or numbers";
      if (!/^\d+$/.test(amount) || Number(amount) < 1) e.amount = "Enter the amount in whole shillings";
      setErrors(e);
      if (Object.keys(e).length) { notify("common.validation"); return; }
      setBusy(true);
      const ok = await resolvePayment(tx.id, tx.org, { action: "confirm", receipt: r, amount: Number(amount) === tx.amount ? undefined : Number(amount) });
      setBusy(false);
      if (ok) onDone();
    } else {
      setBusy(true);
      const ok = await resolvePayment(tx.id, tx.org, { action: "mark_failed", note: note.trim() || undefined });
      setBusy(false);
      if (ok) onDone();
    }
  }

  return (
    <Dialog open={!!tx} onClose={onClose} title="Resolve payment"
      description={tx ? `${tx.org} · ${tx.reference} · ${kes(tx.amount)} requested` : undefined}
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant={mode === "fail" ? "danger" : "primary"} loading={busy} onClick={submit}>{mode === "confirm" ? "Confirm payment" : "Mark as failed"}</Button>
      </>}>
      {tx?.note && <p className="mb-4 rounded-field bg-warning-soft px-4 py-3 text-sm leading-relaxed text-warning">{tx.note}</p>}
      <p className="mb-4 text-sm leading-relaxed text-muted">Check the Safaricom Paybill statement for this payment, then record what you found.</p>
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-field bg-panel p-1" role="radiogroup" aria-label="Outcome">
        {([["confirm", "Money received"], ["fail", "No money received"]] as const).map(([m, label]) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
            className={cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", mode === m ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}>{label}</button>
        ))}
      </div>
      {mode === "confirm" ? (
        <div className="space-y-5">
          <Field label="M-Pesa receipt number" htmlFor="rd-receipt" error={errors.receipt} hint="From the statement, e.g. QGH7K2LQ9P">
            <Input id="rd-receipt" value={receipt} onChange={(e) => setReceipt(e.target.value.toUpperCase().slice(0, 10))}
              className="font-mono uppercase" autoComplete="off" aria-invalid={!!errors.receipt} />
          </Field>
          <Field label="Amount received (KES)" htmlFor="rd-amount" error={errors.amount} hint="Change only if the statement shows a different amount.">
            <Input id="rd-amount" inputMode="numeric" value={amount} className="font-mono" aria-invalid={!!errors.amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 8))} />
          </Field>
        </div>
      ) : (
        <Field label="Note (optional)" htmlFor="rd-note" hint="The organisation is emailed a link to retry the payment.">
          <Textarea id="rd-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. No matching transaction on the statement." />
        </Field>
      )}
    </Dialog>
  );
}