"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { SettingsCard } from "./SettingsCard";
import { ChangeEmailDialog } from "./ChangeEmailDialog";
import { api, toastFailure } from "@/lib/api";
import { squareImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/notify";
import { nameSchema, type NameValues } from "@/lib/validations/profile.client";

const TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PersonalCard({ userId, email, firstName, lastName, avatarUrl, pendingEmail }: {
  userId: string; email: string; firstName: string; lastName: string; avatarUrl: string | null; pendingEmail: string | null;
}) {
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(avatarUrl);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [pending, setPending] = useState(pendingEmail);

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting, isDirty } } = useForm<NameValues>({
    resolver: zodResolver(nameSchema), defaultValues: { first_name: firstName, last_name: lastName },
  });
  const display = `${firstName} ${lastName}`.trim() || email;

  const save = handleSubmit(
    async (values) => {
      const res = await api("/api/profile", { method: "PATCH", json: values, silent: true });
      if (!res.ok) {
        if (res.fields) for (const [k, m] of Object.entries(res.fields)) if (m[0]) setError(k as keyof NameValues, { message: m[0] });
        notify(res.fields ? "common.validation" : "admin.profile.failed");
        if (!res.fields && res.status === 0) toastFailure(res);
        return;
      }
      notify("admin.profile.saved");
      reset(values);
      router.refresh();
    },
    () => notify("common.validation"),
  );

  async function onPick(f: File | undefined) {
    if (!f) return;
    if (!TYPES.includes(f.type) || f.size > 5 * 1024 * 1024) { notify("admin.profile.photo_invalid"); return; }
    setPhotoBusy(true);
    try {
      const supabase = createClient();
      const blob = await squareImage(f);
      const path = `${userId}/avatar`;
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: blob.type, cacheControl: "3600" });
      if (error) throw error;
      const url = `${supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`; // v= avoids the old picture lingering in caches
      const res = await api("/api/profile", { method: "PATCH", json: { avatar_url: url }, silent: true });
      if (!res.ok) throw new Error(res.error);
      setAvatar(url);
      notify("admin.profile.photo_saved");
      router.refresh();
    } catch {
      notify("admin.profile.photo_failed");
    } finally {
      setPhotoBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    const res = await api("/api/profile", { method: "PATCH", json: { avatar_url: null }, silent: true });
    if (!res.ok) { setPhotoBusy(false); notify("admin.profile.photo_failed"); return; }
    await createClient().storage.from("avatars").remove([`${userId}/avatar`]);
    setAvatar(null);
    setPhotoBusy(false);
    notify("admin.profile.photo_removed");
    router.refresh();
  }

  return (
    <SettingsCard id="personal" title="Personal Information" subtitle="Update your photo and personal details."
      footer={<Button loading={isSubmitting} disabled={!isDirty} onClick={save}>Save Changes</Button>}>
      <div className="flex flex-wrap items-center gap-5">
        <Avatar url={avatar} name={display} className="size-[88px] text-2xl" />
        <div className="flex items-center gap-3">
          <input ref={file} type="file" accept={TYPES.join(",")} className="sr-only" aria-label="Choose a photo" onChange={(e) => onPick(e.target.files?.[0])} />
          <Button variant="outline" loading={photoBusy} onClick={() => file.current?.click()}>Change Photo</Button>
          {avatar && <Button variant="ghost" disabled={photoBusy} onClick={removePhoto}>Remove</Button>}
        </div>
      </div>

      <form noValidate onSubmit={save} className="mt-8 grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <Field label="First Name" htmlFor="first_name" error={errors.first_name?.message}>
          <Input id="first_name" autoComplete="given-name" aria-invalid={!!errors.first_name} {...register("first_name")} />
        </Field>
        <Field label="Last Name" htmlFor="last_name" error={errors.last_name?.message}>
          <Input id="last_name" autoComplete="family-name" aria-invalid={!!errors.last_name} {...register("last_name")} />
        </Field>
        <Field className="sm:col-span-2" label="Email Address" htmlFor="email"
          hint={pending ? undefined : "This is the email you sign in with."}>
          <div className="flex gap-3">
            <Input id="email" value={email} readOnly disabled className="disabled:bg-panel/60 disabled:text-muted" />
            <Button type="button" variant="outline" className="shrink-0" onClick={() => setEmailOpen(true)}>Change</Button>
          </div>
          {pending && (
            <p className="mt-2 rounded-field bg-warning-soft px-3 py-2 text-sm text-warning">
              Waiting for you to confirm <strong className="font-semibold">{pending}</strong>. Open the links we emailed to both addresses.
            </p>
          )}
        </Field>
        <Field className="sm:col-span-2" label="System Role" htmlFor="role" hint="Your role determines your access level. Contact IT support to request role changes.">
          <Input id="role" value="Administrator" readOnly disabled className="disabled:bg-panel/60 disabled:text-muted" />
        </Field>
        <button type="submit" className="sr-only" tabIndex={-1}>Save</button>
      </form>

      <ChangeEmailDialog open={emailOpen} currentEmail={email} onClose={() => setEmailOpen(false)}
        onSent={(n) => { setEmailOpen(false); setPending(n); }} />
    </SettingsCard>
  );
}