"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, IconInput, PasswordField } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";
import { loginErrorKey } from "@/lib/auth/login";
import { setRememberCookie } from "@/lib/auth/remember";
import { notify } from "@/lib/notify";
import { loginFormSchema, type LoginFormValues } from "@/lib/validations/auth.client";
import { NAV } from "@/lib/nav";

export function AdminLoginForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { remember: false },
  });

  const onSubmit = handleSubmit(
    async ({ email, password, remember }) => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { notify(loginErrorKey(error)); return; }

      if (data.user.app_metadata?.role !== "admin") {      // org accounts don't belong here
        await supabase.auth.signOut();
        notify("auth.admin.not_admin");
        return;
      }
      setRememberCookie(remember);
      router.replace(NAV.adminDashboard);
      router.refresh();
    },
    () => notify("common.validation"),
  );

  return (
    <>
      <form noValidate onSubmit={onSubmit} className="mt-9 space-y-6">
        <Field label="Admin Email" htmlFor="email" error={errors.email?.message}>
          <IconInput id="email" type="email" icon={Mail} placeholder="admin.name@hheskenya.org" autoComplete="username"
                     aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined}
                     {...register("email")} />
        </Field>

        <PasswordField id="password" icon={Lock} showLink={false} placeholder="Enter your password"
                       autoComplete="current-password" error={errors.password?.message} {...register("password")} />

        <div className="flex items-center justify-between gap-4">
          <Checkbox label="Remember me" {...register("remember")} />
          <Link href={NAV.forgotPassword} className="text-sm font-medium text-primary hover:underline">Forgot password?</Link>
        </div>

        <Button type="submit" full loading={isSubmitting}>Sign In as Administrator</Button>
      </form>

      <div className="mt-8 border-t border-line pt-8">
        <div className="flex gap-3 rounded-field bg-panel p-4 text-[15px] leading-relaxed text-ink">
          <Info size={20} className="mt-0.5 shrink-0 text-muted" aria-hidden />
          <p>
            <strong className="font-semibold">Restricted Access:</strong> Admin accounts are provisioned internally and cannot be
            self-registered. If you need elevated access, please contact the{" "}
            <Link href={NAV.systemsAdministrator} className="font-medium text-primary hover:underline">Systems Administrator</Link>.
          </p>
        </div>
      </div>
    </>
  );
}