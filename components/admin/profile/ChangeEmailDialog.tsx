"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input, PasswordField } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/notify";

export function ChangeEmailDialog({ open, currentEmail, onClose, onSent }: {
  open: boolean; currentEmail: string; onClose: () => void; onSent: (newEmail: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [errors, setErrors] = useState<{ email?: string; pw?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setEmail(""); setPw(""); setErrors({}); } }, [open]);

  async function submit() {
    const next = email.trim().toLowerCase();
    const e: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(next)) e.email = "Enter a valid email address";
    else if (next === currentEmail.toLowerCase()) { e.email = "That's already your email"; notify("admin.profile.email_same"); }
    if (!pw) e.pw = "Enter your password to confirm it's you";
    setErrors(e);
    if (Object.keys(e).length) { if (!e.email || e.pw) notify("common.validation"); return; }

    setBusy(true);
    const supabase = createClient();
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: currentEmail, password: pw });
    if (authErr) {
      setBusy(false);
      if (authErr.status === 0) notify("common.network");
      else { setErrors({ pw: "That isn't your password" }); notify("admin.profile.password_wrong"); }
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: next });
    setBusy(false);
    if (error) {
      if (error.status === 0) notify("common.network");
      else if (error.code === "email_exists" || /already.*(registered|exists)/i.test(error.message)) { setErrors({ email: "Another account uses this address" }); notify("admin.profile.email_taken"); }
      else if (error.status === 429 || error.code === "over_email_send_rate_limit") notify("auth.forgot.rate_limited");
      else notify("admin.profile.email_failed");
      return;
    }
    notify("admin.profile.email_requested", { old: currentEmail, new: next });
    onSent(next);
  }

  return (
    <Dialog open={open} onClose={onClose} title="Change your sign-in email"
      description="We'll email a confirmation link to your current address and to the new one. Open both to finish."
      footer={<><Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button><Button loading={busy} onClick={submit}>Send confirmation links</Button></>}>
      <div className="space-y-5">
        <Field label="New email address" htmlFor="new-email" error={errors.email}>
          <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@hheskenya.org" autoComplete="off" aria-invalid={!!errors.email} />
        </Field>
        <PasswordField id="confirm-pw" label="Your password" showLink={false} value={pw} onChange={(e) => setPw(e.target.value)}
          autoComplete="current-password" placeholder="Enter your password" error={errors.pw} />
      </div>
    </Dialog>
  );
}