"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, KeyRound, Lock, Mail, MapPin, Phone, Smartphone, Tag, User } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, IconInput, PasswordField } from "@/components/ui/Field";
import { ChangeEmailDialog } from "@/components/admin/profile/ChangeEmailDialog";
import { api } from "@/lib/api";
import { squareImage } from "@/lib/image";
import { passwordErrorKey } from "@/lib/auth/login";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/notify";
import { makeRepProfileSchema, type RepProfileValues } from "@/lib/validations/profile.client";
import { maskLocalPhone, toLocalPhone } from "@/lib/utils/format";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const DETAILS = ["contact_name", "phone", "location", "mpesa_phone"] as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const Section = ({ title, subtitle, children, first }: { title: string; subtitle: string; children: ReactNode; first?: boolean }) => (
  <section className={first ? "" : "border-t border-line pt-8"}>
    <h2 className="font-sans text-xl font-semibold text-ink">{title}</h2>
    <p className="mt-1 text-[15px] text-muted">{subtitle}</p>
    <div className="mt-6">{children}</div>
  </section>
);

export function RepProfileForm({ userId, email, pendingEmail, hasPassword, avatarUrl, org }: {
  userId: string; email: string; pendingEmail: string | null; hasPassword: boolean; avatarUrl: string | null;
  org: { name: string; type: string; location: string | null; contactName: string; phone: string | null; mpesaPhone: string | null };
}) {
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(avatarUrl);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [pending, setPending] = useState(pendingEmail);
  const [saving, setSaving] = useState(false);

  const initial = useMemo(() => ({
    contact_name: org.contactName, phone: org.phone ?? "", location: org.location ?? "",
    mpesa_phone: org.mpesaPhone ? toLocalPhone(org.mpesaPhone) : "",
  }), [org.contactName, org.phone, org.location, org.mpesaPhone]);
  const defaults: RepProfileValues = { ...initial, current: "", password: "", confirm: "" };

  const schema = useMemo(() => makeRepProfileSchema([email, org.name], hasPassword), [email, org.name, hasPassword]);
  const { register, handleSubmit, watch, reset, setError, formState: { errors } } = useForm<RepProfileValues>({
    resolver: zodResolver(schema), defaultValues: defaults,
  });
  const v = watch();
  const changed = DETAILS.filter((k) => (v[k] ?? "").trim() !== initial[k]);
  const pwActive = !!(v.password || v.confirm);
  const dirty = changed.length > 0 || pwActive;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const submit = handleSubmit(
    async (vals) => {
      setSaving(true);
      try {
        const supabase = createClient();

        // Prove it's really them before changing a password
        if (pwActive && hasPassword) {
          const { error } = await supabase.auth.signInWithPassword({ email, password: vals.current });
          if (error) {
            if (error.status === 0) notify("common.network");
            else { setError("current", { message: "That isn't your current password" }); notify("rep.profile.password_wrong"); }
            return;
          }
        }

        const patch: Record<string, string> = {};
        for (const k of DETAILS) if (vals[k].trim() !== initial[k]) patch[k] = vals[k].trim();
        if (Object.keys(patch).length) {
          const res = await api("/api/rep/profile", { method: "PATCH", json: patch, silent: true });
          if (!res.ok) {
            if (res.fields) for (const [k, m] of Object.entries(res.fields)) if (m[0]) setError(k as keyof RepProfileValues, { message: m[0] });
            if (res.fields?.mpesa_phone) notify("rep.profile.phone_invalid");
            else notify(res.fields ? "common.validation" : res.status === 0 ? "common.network" : "rep.profile.failed");
            return; // nothing else is changed if the details couldn't be saved
          }
          if (patch.mpesa_phone) notify("rep.profile.phone_saved", { phone: maskLocalPhone(patch.mpesa_phone) });
          else notify("rep.profile.saved");
        }

        if (pwActive) {
          const { error } = await supabase.auth.updateUser({ password: vals.password });
          if (error) { notify(passwordErrorKey(error)); return; }
          await supabase.auth.signOut({ scope: "others" }); // sign out everywhere else
          notify("rep.profile.password_changed");
        }

        reset({ contact_name: vals.contact_name.trim(), phone: vals.phone.trim(), location: vals.location.trim(), mpesa_phone: vals.mpesa_phone.trim(), current: "", password: "", confirm: "" });
        router.refresh();
      } finally {
        setSaving(false);
      }
    },
    () => notify("common.validation"),
  );

  async function onPick(f: File | undefined) {
    if (!f) return;
    if (!TYPES.includes(f.type) || f.size > 5 * 1024 * 1024) { notify("rep.profile.photo_invalid"); return; }
    setPhotoBusy(true);
    try {
      const supabase = createClient();
      const blob = await squareImage(f);
      const path = `${userId}/avatar`;
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: blob.type, cacheControl: "3600" });
      if (error) throw error;
      const url = `${supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
      const res = await api("/api/rep/profile", { method: "PATCH", json: { avatar_url: url }, silent: true });
      if (!res.ok) throw new Error(res.error);
      setAvatar(url);
      notify("rep.profile.photo_saved");
      router.refresh();
    } catch {
      notify("rep.profile.photo_failed");
    } finally {
      setPhotoBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    const res = await api("/api/rep/profile", { method: "PATCH", json: { avatar_url: null }, silent: true });
    if (!res.ok) { setPhotoBusy(false); notify("rep.profile.photo_failed"); return; }
    await createClient().storage.from("avatars").remove([`${userId}/avatar`]);
    setAvatar(null);
    setPhotoBusy(false);
    notify("rep.profile.photo_removed");
    router.refresh();
  }

  const locked = "disabled:bg-panel/60 disabled:text-muted";
  return (
    <form noValidate onSubmit={submit} className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="space-y-8 px-6 py-8 sm:px-10">
        <Section first title="Profile Picture" subtitle="Update the avatar associated with your account.">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar url={avatar} name={org.contactName || org.name} className="size-24 text-2xl" />
            <div className="flex items-center gap-3">
              <input ref={file} type="file" accept={TYPES.join(",")} className="sr-only" aria-label="Choose a picture" onChange={(e) => onPick(e.target.files?.[0])} />
              <Button type="button" variant="outline" loading={photoBusy} onClick={() => file.current?.click()}>Change Avatar</Button>
              {avatar && <Button type="button" variant="dangerOutline" disabled={photoBusy} onClick={removePhoto}>Remove</Button>}
            </div>
          </div>

          <div className="mt-8 grid gap-x-6 gap-y-6 sm:grid-cols-2">
            <Field label="Organisation Name" htmlFor="org_name">
              <IconInput id="org_name" icon={Building2} value={org.name} readOnly disabled className={locked} />
            </Field>
            <Field label="Organisation Type" htmlFor="org_type">
              <IconInput id="org_type" icon={Tag} value={cap(org.type)} readOnly disabled className={locked} />
            </Field>
            <p className="-mt-2 flex items-center gap-2 text-sm text-muted sm:col-span-2"><Lock size={14} aria-hidden /> HHES approved your organisation under this name and type. To change them, contact HHES.</p>
            <Field className="sm:col-span-2" label="Physical Address / Location" htmlFor="location" error={errors.location?.message}
              hint="Shown on your orders so HHES knows who is collecting.">
              <IconInput id="location" icon={MapPin} placeholder="e.g. 1st Avenue, Nairobi" autoComplete="street-address" aria-invalid={!!errors.location} {...register("location")} />
            </Field>
          </div>
        </Section>

        <Section title="Contact Information" subtitle="Details of the primary representative for this organisation.">
          <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
            <Field label="Contact Name" htmlFor="contact_name" error={errors.contact_name?.message}>
              <IconInput id="contact_name" icon={User} autoComplete="name" aria-invalid={!!errors.contact_name} {...register("contact_name")} />
            </Field>
            <Field label="Phone Number" htmlFor="phone" error={errors.phone?.message}>
              <IconInput id="phone" icon={Phone} type="tel" inputMode="tel" placeholder="+254 700 000 000" autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
            </Field>
            <Field className="sm:col-span-2" label="Email Address" htmlFor="email" hint={pending ? undefined : "This is the email you sign in with."}>
              <div className="flex gap-3">
                <IconInput id="email" icon={Mail} value={email} readOnly disabled className={locked} />
                <Button type="button" variant="outline" className="shrink-0" onClick={() => setEmailOpen(true)}>Change</Button>
              </div>
              {pending && (
                <p className="mt-2 rounded-field bg-warning-soft px-3 py-2 text-sm text-warning">
                  Waiting for you to confirm <strong className="font-semibold">{pending}</strong>. Open the links we emailed to both addresses.
                </p>
              )}
            </Field>
            <Field className="sm:col-span-2" label="Default M-Pesa number" htmlFor="mpesa_phone" error={errors.mpesa_phone?.message}
              hint="The Safaricom number that receives payment prompts. You can still use a different number at checkout.">
              <IconInput id="mpesa_phone" icon={Smartphone} type="tel" inputMode="tel" placeholder="0712 345 678" autoComplete="off" aria-invalid={!!errors.mpesa_phone} {...register("mpesa_phone")} />
            </Field>
          </div>
        </Section>

        <Section title="Security Settings" subtitle="Update your password to ensure your account remains secure.">
          <div className="space-y-6">
            {/* lets the browser tie a new password to this account */}
            <input type="email" name="username" autoComplete="username" defaultValue={email} readOnly tabIndex={-1} aria-hidden className="sr-only" />
            {hasPassword ? (
              <PasswordField id="current" icon={Lock} label="Current Password" showLink={false} placeholder="Enter your current password"
                autoComplete="current-password" error={errors.current?.message} {...register("current")} />
            ) : (
              <p className="rounded-field bg-panel px-4 py-3 text-sm leading-relaxed text-muted">You signed in with Google, so you don't have a password yet. Set one below if you'd also like to sign in with your email.</p>
            )}
            <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
              <PasswordField id="password" icon={KeyRound} label="New Password" showLink={false} placeholder="Enter new password" autoComplete="new-password"
                meter={{ value: v.password ?? "", context: [email, org.name, v.contact_name ?? ""] }} error={errors.password?.message} {...register("password")} />
              <PasswordField id="confirm" icon={KeyRound} label="Confirm New Password" showLink={false} placeholder="Confirm new password" autoComplete="new-password"
                error={errors.confirm?.message} {...register("confirm")} />
            </div>
          </div>
        </Section>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-panel px-6 py-5 sm:px-10">
        {dirty && <span className="mr-auto text-sm font-medium text-warning">Unsaved changes</span>}
        <Button type="button" variant="outline" disabled={!dirty || saving} onClick={() => reset(defaults)}>Cancel Changes</Button>
        <Button type="submit" loading={saving} disabled={!dirty}>Save Changes</Button>
      </div>

      <ChangeEmailDialog open={emailOpen} currentEmail={email} onClose={() => setEmailOpen(false)}
        onSent={(n) => { setEmailOpen(false); setPending(n); }} />
    </form>
  );
}