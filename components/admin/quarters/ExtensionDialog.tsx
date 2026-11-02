"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { api } from "@/lib/api";
import { grantExtension } from "@/lib/admin/quarterActions";
import { notify } from "@/lib/notify";
import { addDays } from "@/lib/utils/deadline";
import { fmtDate } from "@/lib/utils/format";
import type { ExtensionRow, QuarterRow } from "@/lib/admin/quarters";
import type { OrgRow } from "@/lib/admin/organisations";

type Picked = { id: string; name: string };

function OrgPicker({ value, onChange }: { value: Picked | null; onChange: (o: Picked | null) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<OrgRow[]>([]);

  useEffect(() => {
    if (value) return;
    const t = setTimeout(async () => {
      const res = await api<{ data: OrgRow[] }>(`/api/organisations?status=approved&page_size=8&q=${encodeURIComponent(q)}`, { silent: true });
      if (res.ok) setResults(res.data.data);
    }, 250);
    return () => clearTimeout(t);
  }, [q, value]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-field border border-line bg-field px-3.5 py-2.5">
        <span className="text-[15px] font-medium text-ink">{value.name}</span>
        <button type="button" onClick={() => onChange(null)} aria-label="Choose a different organisation" className="text-muted hover:text-ink"><X size={16} /></button>
      </div>
    );
  }
  return (
    <div>
      <Input id="ext-org" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search approved organisations..." autoComplete="off" />
      <ul className="mt-2 max-h-48 overflow-y-auto rounded-field border border-line">
        {results.length === 0 ? <li className="px-3.5 py-3 text-sm text-muted">No organisations found.</li> : results.map((o) => (
          <li key={o.id}>
            <button type="button" onClick={() => onChange({ id: o.id, name: o.name })} className="block w-full px-3.5 py-2.5 text-left hover:bg-canvas">
              <span className="block text-[15px] text-ink">{o.name}</span>
              <span className="block text-sm text-muted">{o.contact_email}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExtensionDialog({ open, quarter, extensions, initialOrgId, onClose, onDone }: {
  open: boolean; quarter: QuarterRow | null; extensions: ExtensionRow[]; initialOrgId?: string; onClose: () => void; onDone: () => void;
}) {
  const [org, setOrg] = useState<Picked | null>(null);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // Reset when opened; prefill the organisation when we came from its side panel
  useEffect(() => {
    if (!open) return;
    setOrg(null); setDate(""); setReason(""); setErrors({});
    if (!initialOrgId) return;
    api<{ data: { id: string; name: string } }>(`/api/organisations/${initialOrgId}`, { silent: true })
      .then((res) => { if (res.ok) setOrg({ id: res.data.data.id, name: res.data.data.name }); });
  }, [open, initialOrgId]);

  // Their current deadline: the latest extension, or the quarter's own
  const current = useMemo(() => {
    if (!quarter || !org) return quarter?.deadline_date ?? "";
    const mine = extensions.filter((e) => e.organisation_id === org.id && e.quarter_id === quarter.id).map((e) => e.new_deadline).sort();
    const last = mine.at(-1);
    return last && last > quarter.deadline_date ? last : quarter.deadline_date;
  }, [extensions, org, quarter]);

  async function submit() {
    if (!quarter || !org) return;
    const e: Record<string, string> = {};
    if (!date) e.date = "Pick the new deadline";
    else if (date <= current) e.date = `Pick a date after ${fmtDate(current)}`;
    if (reason.trim().length < 5) e.reason = "Give a reason. It's recorded in the audit log.";
    setErrors(e);
    if (Object.keys(e).length) { notify(e.reason && !e.date ? "admin.override.reason_required" : "common.validation"); return; }

    setBusy(true);
    const ok = await grantExtension({ organisation_id: org.id, quarter_id: quarter.id, new_deadline: date, reason: reason.trim() }, org.name);
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Grant deadline extension"
      description={quarter ? `Lets one organisation order for ${quarter.name} after the deadline.` : undefined}
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button loading={busy} disabled={!quarter || !org} onClick={submit}>Grant extension</Button>
      </>}>
      {!quarter ? (
        <p className="text-[15px] text-muted">There's no open quarter. Extensions apply to the open quarter only.</p>
      ) : (
        <div className="space-y-5">
          <Field label="Organisation" htmlFor="ext-org"><OrgPicker value={org} onChange={setOrg} /></Field>
          {org && (
            <p className="rounded-field bg-panel px-4 py-3 text-sm text-muted">
              {org.name}'s current deadline is <strong className="font-medium text-ink">{fmtDate(current)}</strong>.
            </p>
          )}
          <Field label="New deadline" htmlFor="ext-date" error={errors.date} hint="Orders close at the end of this day.">
            <Input id="ext-date" type="date" value={date} min={current ? addDays(current, 1) : undefined}
              disabled={!org} aria-invalid={!!errors.date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Reason" htmlFor="ext-reason" error={errors.reason}>
            <Textarea id="ext-reason" value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={!!errors.reason}
              placeholder="e.g. Treasurer was travelling and the church board approved the order late." />
          </Field>
        </div>
      )}
    </Dialog>
  );
}