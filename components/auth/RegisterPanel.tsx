"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Field, Input, PasswordField, Select } from "@/components/ui/Field";
import { GoogleButton } from "./GoogleButton";
import { RegistrationSubmitted } from "./RegistrationSubmitted";
import { api } from "@/lib/api";
import { notify } from "@/lib/notify";
import { registerFormSchema, type RegisterFormValues } from "@/lib/validations/auth.client";
import { FEATURES } from "@/lib/config";
import { NAV } from "@/lib/nav";

export function RegisterPanel() {
  const [submitted, setSubmitted] = useState<{ org: string; email: string } | null>(null);

  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
  });

  const [pw, email, org, contact] = watch(["password", "email", "org_name", "contact_name"]);

  const onSubmit = handleSubmit(
    async (values) => {
      const res = await api("/api/auth/register", { json: values }); // failures toast automatically
      if (res.ok) {
        notify("auth.register.success", { email: values.email, org: values.org_name });
        setSubmitted({ org: values.org_name, email: values.email });
        return;
      }
      // Inline messages next to the fields, on top of the toast
      if (res.fields) {
        for (const [field, msgs] of Object.entries(res.fields)) {
          if (msgs[0]) setError(field as keyof RegisterFormValues, { message: msgs[0] });
        }
      } else if (res.status === 409) {
        setError("email", { message: res.error });
      }
    },
    () => notify("common.validation"),
  );

  if (submitted) return <RegistrationSubmitted org={submitted.org} email={submitted.email} />;

  return (
    <section>
      <h1 className="text-3xl font-bold leading-tight text-ink">Register Organisation</h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        Register your church or institution to start ordering online without visiting HHES in person.
      </p>

      {FEATURES.googleSignIn && (
        <>
          <div className="mt-8"><GoogleButton /></div>
          <div className="my-8 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <span className="text-sm font-medium uppercase tracking-[0.08em] text-muted">Or register with email</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form noValidate onSubmit={onSubmit} className={`grid gap-x-5 gap-y-6 sm:grid-cols-2 ${FEATURES.googleSignIn ? "" : "mt-8"}`}>
        <Field label="Organisation Name" htmlFor="org_name" error={errors.org_name?.message}>
          <Input id="org_name" placeholder="e.g. Central SDA Church" autoComplete="organization"
                 aria-invalid={!!errors.org_name} aria-describedby={errors.org_name ? "org_name-error" : undefined}
                 {...register("org_name")} />
        </Field>

        <Field label="Organisation Type" htmlFor="org_type" error={errors.org_type?.message}>
          <Select id="org_type" required defaultValue="" aria-invalid={!!errors.org_type}
                  aria-describedby={errors.org_type ? "org_type-error" : undefined} {...register("org_type")}>
            <option value="" disabled>Select type...</option>
            <option value="church">Church</option>
            <option value="university">University</option>
            <option value="school">School</option>
          </Select>
        </Field>

        <Field label="Contact Name" htmlFor="contact_name" error={errors.contact_name?.message}>
          <Input id="contact_name" placeholder="John Doe" autoComplete="name"
                 aria-invalid={!!errors.contact_name} aria-describedby={errors.contact_name ? "contact_name-error" : undefined}
                 {...register("contact_name")} />
        </Field>

        <Field label="Email Address" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" placeholder="name@organisation.com" autoComplete="username"
                 aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined}
                 {...register("email")} />
        </Field>

        <div className="sm:col-span-2">
          <PasswordField id="password" placeholder="Create a secure password" autoComplete="new-password"
                         meter={{ value: pw ?? "", context: [email ?? "", org ?? "", contact ?? ""] }}
                         error={errors.password?.message} {...register("password")} />
        </div>

        <Button type="submit" full loading={isSubmitting} className="sm:col-span-2">Create Account</Button>
      </form>

      <div className="mt-8 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-[15px] leading-relaxed text-muted">
          Already requested access before? Use the separate organisation sign in page to access your account after approval.
        </p>
        <Link href={NAV.login} className={buttonStyles({ variant: "outline" }) + " shrink-0"}>Go to Sign In</Link>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        By registering, you agree to our{" "}
        <Link href={NAV.terms} className="font-medium text-primary hover:underline">Terms of Service</Link> and{" "}
        <Link href={NAV.privacy} className="font-medium text-primary hover:underline">Privacy Policy</Link>.
      </p>
    </section>
  );
}