"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Checkbox, Field, Input, PasswordField } from "@/components/ui/Field";
import { GoogleButton } from "./GoogleButton";
import { createClient } from "@/lib/supabase/client";
import { loginErrorKey, STATUS_MESSAGE } from "@/lib/auth/login";
import { clearRememberCookies, setRememberCookie } from "@/lib/auth/remember";
import { notify } from "@/lib/notify";
import { loginFormSchema, type LoginFormValues } from "@/lib/validations/auth.client";
import { FEATURES } from "@/lib/config";
import { NAV } from "@/lib/nav";

export function LoginPanel() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { remember: true },
  });

  const onSubmit = handleSubmit(
    async ({ email, password, remember }) => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { notify(loginErrorKey(error)); return; }

      setRememberCookie(remember);
      const user = data.user;

      // An admin who used this page: send them to their console
      if (user.app_metadata?.role === "admin") { router.replace(NAV.adminDashboard); router.refresh(); return; }

      const { data: org } = await supabase.from("organisations").select("status").eq("user_id", user.id).maybeSingle();
      if (!org) { router.replace("/register/complete"); return; }          // signed up with Google, never finished
      if (org.status !== "approved") {                                       // BR-09: no access until approved
        await supabase.auth.signOut();
        clearRememberCookies();
        notify(STATUS_MESSAGE[org.status] ?? "auth.login.failed");
        return;
      }
      router.replace(NAV.repDashboard);
      router.refresh();
    },
    () => notify("common.validation"),
  );

  return (
    <section>
      <h1 className="text-3xl font-bold leading-tight text-ink">Sign In</h1>
      <p className="mt-3 text-base leading-relaxed text-muted">Access your organisation's secure ordering dashboard.</p>

      {FEATURES.googleSignIn && (
        <>
          <div className="mt-8"><GoogleButton /></div>
          <div className="my-8 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <span className="text-sm font-medium uppercase tracking-[0.08em] text-muted">Or sign in with email</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form noValidate onSubmit={onSubmit} className={`space-y-6 ${FEATURES.googleSignIn ? "" : "mt-8"}`}>
        <Field label="Email Address" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" placeholder="name@organisation.com" autoComplete="email"
                 aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined}
                 {...register("email")} />
        </Field>

        <PasswordField id="password" placeholder="Enter your password" autoComplete="current-password"
                       error={errors.password?.message} {...register("password")} />

        <div className="flex items-center justify-between gap-4">
          <Checkbox label="Remember me" {...register("remember")} />
          <Link href={NAV.forgotPassword} className="text-sm font-medium text-primary hover:underline">Forgot password?</Link>
        </div>

        <Button type="submit" full loading={isSubmitting}>Sign In</Button>
      </form>

      <div className="mt-8 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-[15px] leading-relaxed text-muted">
          New to the online portal? Request access for your church or institution.
        </p>
        <Link href={NAV.register} className={buttonStyles({ variant: "outline" }) + " shrink-0"}>Register Organisation</Link>
      </div>
    </section>
  );
}