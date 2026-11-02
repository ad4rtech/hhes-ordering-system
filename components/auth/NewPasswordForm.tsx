"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";
import { passwordErrorKey } from "@/lib/auth/login";
import { clearRememberCookies } from "@/lib/auth/remember";
import { notify, notifyNext } from "@/lib/notify";
import { makeNewPasswordSchema, type NewPasswordValues } from "@/lib/validations/auth.client";
import { NAV } from "@/lib/nav";

export function NewPasswordForm({ mode, email }: { mode: "reset" | "invite"; email: string }) {
  const router = useRouter();
  const schema = useMemo(() => makeNewPasswordSchema([email]), [email]);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<NewPasswordValues>({
    resolver: zodResolver(schema),
  });
  const pw = watch("password") ?? "";

  const onSubmit = handleSubmit(
    async ({ password }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const isAdmin = user?.app_metadata?.role === "admin";

      const { error } = await supabase.auth.updateUser({ password });
      if (error) { notify(passwordErrorKey(error)); return; }

      if (mode === "invite" && isAdmin) { // invited admin: already signed in, take them straight in
        notifyNext("auth.invite.accepted");
        router.replace(NAV.adminDashboard);
        router.refresh();
        return;
      }
      await supabase.auth.signOut(); // reset: sign in again with the new password
      clearRememberCookies();
      notifyNext("auth.reset.success");
      router.replace(isAdmin ? NAV.adminLogin : NAV.login);
      router.refresh();
    },
    () => notify("common.validation"),
  );

  return (
    <form noValidate onSubmit={onSubmit} className="mt-9 space-y-6">
      {/* Invisible: lets the browser pair the new password with this account when saving it */}
      <input type="email" name="username" autoComplete="username" defaultValue={email} readOnly tabIndex={-1} aria-hidden className="sr-only" />
      <PasswordField id="password" icon={Lock} label="New Password" placeholder="Create a secure password"
                     autoComplete="new-password" meter={{ value: pw, context: [email] }}
                     error={errors.password?.message} {...register("password")} />
      <PasswordField id="confirm" icon={Lock} label="Confirm Password" showLink={false} placeholder="Re-enter your password"
                     autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />
      <Button type="submit" full loading={isSubmitting}>{mode === "invite" ? "Activate Account" : "Update Password"}</Button>
    </form>
  );
}