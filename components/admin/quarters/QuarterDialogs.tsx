"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { closeQuarter, createQuarter, publishQuarter, updateQuarter } from "@/lib/admin/quarterActions";
import { notify } from "@/lib/notify";
import { kes } from "@/lib/utils/format";
import type { QuarterRow } from "@/lib/admin/quarters";

const suggest = (d: string) => `Q${Math.floor((Number(d.slice(5, 7)) - 1) / 3) + 1} ${d.slice(0, 4)}`;

// ── create / edit ──
export function QuarterFormDialog({ dialog, existingNames, onClose, onDone }: {
  dialog: { type: "create" } | { type: "edit"; q: QuarterRow } | null;
  existingNames: string[]; onClose: () => void; onDone: () => void;
}) {
  const editing = dialog?.type === "edit" ? dialog.q : null;
  const open = !!dialog;
  const [name, setName] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? ""); setOpenDate(editing?.open_date ?? ""); setDeadline(editing?.deadline_date ?? "");
    setTouched(!!editing); setErrors({});
  }, [open, editing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function validate() {
    const e: Record<string, string> = {};
    const n = name.trim();
    if (n.length < 2) e.name = "Enter a name, e.g. Q1 2027";
    else if (existingNames.some((x) => x.toLowerCase() === n.toLowerCase() && x !== editing?.name)) e.name = "A quarter with this name already exists";
    if (!openDate) e.open = "Pick the date ordering opens";
    if (!deadline) e.deadline = "Pick the ordering deadline";
    else if (openDate && deadline < openDate) e.deadline = "The deadline must be on or after the opening date";
    return e;
  }

  async function submit() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { notify("common.validation"); return; }
    setBusy(true);
    const v = { name: name.trim(), open_date: openDate, deadline_date: deadline };
    const ok = editing ? await updateQuarter(editing.id, v) : await createQuarter(v);
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <Dialog open={open} onClose={onClose} title={editing ? `Edit ${editing.name}` : "New quarter"}
      description={editing ? "Only drafts can be edited." : "It starts as a draft. Set its prices, then publish it to open ordering."}
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button loading={busy} onClick={submit}>{editing ? "Save changes" : "Create quarter"}</Button>
      </>}>
      <div className="space-y-5">
        <Field label="Quarter name" htmlFor="q-name" error={errors.name}>
          <Input id="q-name" value={name} placeholder="e.g. Q1 2027" aria-invalid={!!errors.name}
            onChange={(e) => { setName(e.target.value); setTouched(true); }} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Ordering opens" htmlFor="q-open" error={errors.open}>
            <Input id="q-open" type="date" value={openDate} aria-invalid={!!errors.open}
              onChange={(e) => { setOpenDate(e.target.value); if (!touched && e.target.value) setName(suggest(e.target.value)); }} />
          </Field>
          <Field label="Order deadline" htmlFor="q-deadline" error={errors.deadline} hint="Orders close at the end of this day.">
            <Input id="q-deadline" type="date" value={deadline} min={openDate || undefined} aria-invalid={!!errors.deadline}
              onChange={(e) => setDeadline(e.target.value)} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

const Check1 = ({ ok, children }: { ok: boolean; children: ReactNode }) => (
  <li className="flex items-start gap-3 text-[15px]">
    <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
      {ok ? <Check size={12} strokeWidth={3} aria-hidden /> : <X size={12} strokeWidth={3} aria-hidden />}
    </span>
    <span className="text-ink">{children}</span>
  </li>
);

// ── publish ──
export function PublishDialog({ q, active, onClose, onDone }: { q: QuarterRow | null; active: QuarterRow | null; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const pricesOk = (q?.priced_categories ?? 0) >= 6;
  const noneOpen = !active;

  async function go() {
    if (!q) return;
    setBusy(true);
    const ok = await publishQuarter(q, active?.name);
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <Dialog open={!!q} onClose={onClose} title={`Publish ${q?.name ?? ""}?`}
      description="Organisations will be emailed and can start ordering straight away."
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button loading={busy} disabled={!pricesOk || !noneOpen} onClick={go}>Publish quarter</Button>
      </>}>
      <ul className="space-y-3">
        <Check1 ok={pricesOk}>
          All six categories have a price ({q?.priced_categories ?? 0} of 6).{" "}
          {!pricesOk && q && <Link href={`/admin/catalogue?quarter=${q.id}`} className="font-medium text-primary hover:underline">Set prices</Link>}
        </Check1>
        <Check1 ok={noneOpen}>{noneOpen ? "No other quarter is open." : `${active?.name} is still open. Close it first.`}</Check1>
      </ul>
      <p className="mt-5 rounded-field bg-panel px-4 py-3 text-sm leading-relaxed text-muted">
        Prices are locked as soon as a quarter is published. Stock levels can still be changed.
      </p>
    </Dialog>
  );
}

// ── close ──
export function CloseDialog({ q, onClose, onDone }: { q: QuarterRow | null; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const unpaid = q ? q.orders - q.paid_orders : 0;

  async function go() {
    if (!q) return;
    setBusy(true);
    const ok = await closeQuarter(q);
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <Dialog open={!!q} onClose={onClose} title={`Close ${q?.name ?? ""}?`}
      description="Organisations can no longer place or amend orders, including those with a deadline extension."
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" loading={busy} onClick={go}>Close quarter</Button>
      </>}>
      <ul className="space-y-2 text-[15px] leading-relaxed text-ink">
        <li><strong className="font-medium">{q?.paid_orders ?? 0}</strong> paid {q?.paid_orders === 1 ? "order" : "orders"} ({kes(q?.revenue_kes ?? 0)}) can still be prepared and collected.</li>
        <li><strong className="font-medium">{unpaid}</strong> unpaid {unpaid === 1 ? "order" : "orders"} won't proceed to fulfilment.</li>
      </ul>
      <p className="mt-5 rounded-field bg-panel px-4 py-3 text-sm leading-relaxed text-muted">This can't be undone.</p>
    </Dialog>
  );
}