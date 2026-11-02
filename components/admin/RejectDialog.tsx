"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { orgAction } from "@/lib/admin/orgActions";
import { notify } from "@/lib/notify";
import type { OrgRow } from "@/lib/admin/organisations";

export function RejectDialog({ org, onClose, onDone }: { org: OrgRow | null; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => { setReason(""); setError(undefined); }, [org?.id]);

  async function submit() {
    if (!org) return;
    if (reason.trim().length < 3) {
      setError("Tell the organisation why it wasn't approved.");
      notify("admin.org.reason_required");
      return;
    }
    setBusy(true);
    const ok = await orgAction(org, { action: "reject", reason: reason.trim() });
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <Dialog open={!!org} onClose={onClose} title={`Reject ${org?.name ?? ""}?`}
      description="The reason is emailed to the organisation so they know what to fix."
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" loading={busy} onClick={submit}>Reject registration</Button>
      </>}>
      <Field label="Reason" htmlFor="reject-reason" error={error}>
        <Textarea id="reject-reason" value={reason} onChange={(e) => { setReason(e.target.value); setError(undefined); }}
          placeholder="e.g. We couldn't match this organisation to a recognised SDA church." aria-invalid={!!error} />
      </Field>
    </Dialog>
  );
}