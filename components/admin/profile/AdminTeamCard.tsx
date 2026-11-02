"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { SettingsCard } from "./SettingsCard";
import { api, toastFailure } from "@/lib/api";
import { notify } from "@/lib/notify";
import { fmtDay, timeAgo } from "@/lib/utils/format";
import type { AdminMember } from "@/lib/admin/team";

function InviteDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setName(""); setEmail(""); setErrors({}); } }, [open]);

  async function submit() {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = "Enter their full name";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email address";
    setErrors(e);
    if (Object.keys(e).length) { notify("common.validation"); return; }

    setBusy(true);
    const res = await api("/api/admin/invite", { json: { email: email.trim(), full_name: name.trim() }, silent: true });
    setBusy(false);
    if (res.ok) { notify("admin.invite.sent", { email: email.trim() }); onDone(); return; }
    if (res.status === 409) { setErrors({ email: "This email already has an account" }); notify("admin.invite.exists", { email: email.trim() }); }
    else if (res.fields) { setErrors({ name: res.fields.full_name?.[0], email: res.fields.email?.[0] }); notify("common.validation"); }
    else if (res.status === 0) toastFailure(res);
    else notify("admin.invite.failed");
  }

  return (
    <Dialog open={open} onClose={onClose} title="Invite an administrator"
      description="They'll get an email with a link to set their password. Administrators have full access to the console."
      footer={<><Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button><Button loading={busy} onClick={submit}><MailPlus size={16} aria-hidden /> Send invitation</Button></>}>
      <div className="space-y-5">
        <Field label="Full name" htmlFor="inv-name" error={errors.name}>
          <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grace Wanjiru" autoComplete="off" aria-invalid={!!errors.name} />
        </Field>
        <Field label="Email address" htmlFor="inv-email" error={errors.email}>
          <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@hheskenya.org" autoComplete="off" aria-invalid={!!errors.email} />
        </Field>
      </div>
    </Dialog>
  );
}

export function AdminTeamCard({ admins, currentId }: { admins: AdminMember[]; currentId: string }) {
  const router = useRouter();
  const [inviting, setInviting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [revoke, setRevoke] = useState<AdminMember | null>(null);

  async function act(a: AdminMember, action: "resend" | "revoke") {
    setBusy(a.id);
    const res = await api(`/api/admin/admins/${a.id}`, { method: "PATCH", json: { action }, silent: true });
    setBusy(null);
    setRevoke(null);
    if (res.ok) { notify(action === "resend" ? "admin.invite.resent" : "admin.invite.revoked", { email: a.email }); router.refresh(); }
    else if (/already signed in/i.test(res.error)) { notify("admin.invite.signed_in"); router.refresh(); }
    else toastFailure(res);
  }

  return (
    <SettingsCard id="team" title="Admin Team" subtitle="People with full access to the admin console."
      action={<Button variant="outline" onClick={() => setInviting(true)}><MailPlus size={18} aria-hidden /> Invite admin</Button>}>
      <ul className="-my-3 divide-y divide-line">
        {admins.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar url={a.avatarUrl} name={a.name} className="size-11 shrink-0 text-sm" />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-ink">{a.name}{a.id === currentId && <span className="ml-2 text-sm font-normal text-muted">(you)</span>}</p>
                <p className="truncate text-sm text-muted">{a.email}</p>
                <p className="text-sm text-muted" suppressHydrationWarning>
                  {a.status === "pending" ? `Invited ${fmtDay(a.invitedAt)}` : a.lastSignIn ? `Last active ${timeAgo(a.lastSignIn)}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={a.status === "pending" ? "warning" : "successSoft"}>{a.status === "pending" ? "Invite pending" : "Active"}</Badge>
              {a.status === "pending" && a.id !== currentId && (
                <>
                  <Button variant="outline" size="sm" loading={busy === a.id} onClick={() => act(a, "resend")}>Resend</Button>
                  <Button variant="dangerOutline" size="sm" disabled={busy === a.id} onClick={() => setRevoke(a)}>Revoke</Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      <InviteDialog open={inviting} onClose={() => setInviting(false)} onDone={() => { setInviting(false); router.refresh(); }} />
      <ConfirmDialog open={!!revoke} onClose={() => setRevoke(null)} tone="danger" loading={!!revoke && busy === revoke.id}
        title={`Revoke the invitation for ${revoke?.name ?? ""}?`}
        description="Their link stops working and the account is removed. You can invite them again later."
        confirmLabel="Revoke invitation" onConfirm={() => revoke && act(revoke, "revoke")} />
    </SettingsCard>
  );
}