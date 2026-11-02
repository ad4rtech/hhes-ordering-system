"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/Field";
import { SettingsCard } from "./SettingsCard";
import { createClient } from "@/lib/supabase/client";
import { passwordErrorKey } from "@/lib/auth/login";
import { notify } from "@/lib/notify";
import { makePasswordSchema, type PasswordValues } from "@/lib/validations/profile.client";

export function SecurityCard({ email, name }: { email: string; name: string }) {
  const schema = useMemo(() => makePasswordSchema([email, name]), [email, name]);
  const { register, handleSubmit, watch, reset, setError, formState: { errors, isSubmitting } } = useForm<PasswordValues>({
    resolver: zodResolver(schema),
  });
  const pw = watch("password") ?? "";

  const submit = handleSubmit(
    async ({ current, password }) => {
      const supabase = createClient();

      // Prove it's really you before changing anything
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password: current });
      if (authErr) {
        if (authErr.status === 0) notify("common.network");
        else { setError("current", { message: "That isn't your current password" }); notify("admin.profile.password_wrong"); }
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { notify(passwordErrorKey(error)); return; }

      await supabase.auth.signOut({ scope: "others" }); // sign out everywhere else
      notify("admin.profile.password_changed");
      reset({ current: "", password: "", confirm: "" });
    },
    () => notify("common.validation"),
  );

  return (
    <SettingsCard id="security" title="Security & Password" subtitle="Update your password to keep your account secure."
      footer={<Button variant="outline" loading={isSubmitting} onClick={submit}>Update Password</Button>}>
      <form noValidate onSubmit={submit} className="space-y-6">
        {/* lets the browser tie the new password to this account */}
        <input type="email" name="username" autoComplete="username" defaultValue={email} readOnly tabIndex={-1} aria-hidden className="sr-only" />
        <PasswordField id="current" label="Current Password" showLink={false} placeholder="Enter your current password"
          autoComplete="current-password" error={errors.current?.message} {...register("current")} />
        <PasswordField id="password" label="New Password" placeholder="Enter new password" autoComplete="new-password"
          meter={{ value: pw, context: [email, name] }} error={errors.password?.message} {...register("password")} />
        <PasswordField id="confirm" label="Confirm New Password" showLink={false} placeholder="Confirm new password"
          autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />
        <button type="submit" className="sr-only" tabIndex={-1}>Update</button>
      </form>
    </SettingsCard>
  );
}