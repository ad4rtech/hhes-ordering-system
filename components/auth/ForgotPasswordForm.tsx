"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, Mail, MailCheck } from "lucide-react";
import { AuthCard } from "./AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, IconInput } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/notify";
import { forgotFormSchema, type ForgotFormValues } from "@/lib/validations/auth.client";
import { NAV } from "@/lib/nav";

const BackToSignIn = () => (
  <div className="mt-8 flex justify-center">
    <Link href={NAV.login} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
      <ArrowLeft size={16} aria-hidden /> Back to Sign In
    </Link>
  </div>
);

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotFormSchema),
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Same answer whether or not the account exists (no account enumeration)
  async function send(email: string) {
    const { error } = await createClient().auth.resetPasswordForEmail(email);
    if (error) {
      if (error.status === 0) notify("common.network");
      else if (error.status === 429 || error.code === "over_email_send_rate_limit") notify("auth.forgot.rate_limited");
      else notify("auth.forgot.failed");
      return;
    }
    notify("auth.forgot.sent", { email });
    setSentTo(email);
    setCooldown(60);
  }

  const onSubmit = handleSubmit(({ email }) => send(email), () => notify("common.validation"));

  if (sentTo) {
    return (
      <AuthCard
        icon={MailCheck} tone="success" title="Check your email"
        subtitle={<>If an account exists for <strong className="font-medium text-ink">{sentTo}</strong>, we've sent a link to reset your password.</>}
      >
        <p className="mt-6 rounded-field bg-panel px-4 py-3 text-sm leading-relaxed text-muted">
          Can't see it? Check your spam folder. The link only works for a limited time.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="outline" full disabled={cooldown > 0} loading={resending}
                  onClick={async () => { setResending(true); await send(sentTo); setResending(false); }}>
            {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend email"}
          </Button>
          <Button variant="ghost" full onClick={() => setSentTo(null)}>Use a different email</Button>
        </div>
        <BackToSignIn />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon={KeyRound} title="Forgot your password?"
      subtitle="Enter the email address you signed up with and we'll send you a link to reset your password."
    >
      <form noValidate onSubmit={onSubmit} className="mt-9 space-y-6">
        <Field label="Email Address" htmlFor="email" error={errors.email?.message}>
          <IconInput id="email" type="email" icon={Mail} placeholder="name@organisation.com" autoComplete="email"
                     aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined}
                     {...register("email")} />
        </Field>
        <Button type="submit" full loading={isSubmitting}>Send Reset Link</Button>
      </form>
      <BackToSignIn />
    </AuthCard>
  );
}