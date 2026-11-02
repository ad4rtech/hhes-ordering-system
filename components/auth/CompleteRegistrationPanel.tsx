"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { RegistrationSubmitted } from "./RegistrationSubmitted";
import { api } from "@/lib/api";
import { notify } from "@/lib/notify";
import { completeFormSchema, type CompleteFormValues } from "@/lib/validations/auth.client";

export function CompleteRegistrationPanel({ email, defaultName }: { email: string; defaultName: string }) {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<CompleteFormValues>({
    resolver: zodResolver(completeFormSchema),
    defaultValues: { contact_name: defaultName },
  });

  const onSubmit = handleSubmit(
    async (values) => {
      const res = await api("/api/auth/complete-registration", { json: values });
      if (res.ok) {
        notify("auth.complete.success", { email, org: values.org_name });
        setSubmitted(values.org_name);
        return;
      }
      if (res.fields)
        for (const [field, msgs] of Object.entries(res.fields))
          if (msgs[0]) setError(field as keyof CompleteFormValues, { message: msgs[0] });
    },
    () => notify("common.validation"),
  );

  if (submitted) return <RegistrationSubmitted org={submitted} email={email} signedIn />;

  return (
    <section>
      <h1 className="text-3xl font-bold leading-tight text-ink">Finish registering</h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        You're signed in with Google. Tell us about your organisation and we'll send it to HHES for approval.
      </p>

      <div className="mt-8 rounded-field border border-line bg-panel px-4 py-3 text-[15px]">
        <span className="text-muted">Signed in as </span>
        <span className="font-medium text-ink">{email}</span>
      </div>

      <form noValidate onSubmit={onSubmit} className="mt-6 grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <Field label="Organisation Name" htmlFor="org_name" error={errors.org_name?.message}>
          <Input id="org_name" placeholder="e.g. Central SDA Church" autoComplete="organization"
                 aria-invalid={!!errors.org_name} {...register("org_name")} />
        </Field>
        <Field label="Organisation Type" htmlFor="org_type" error={errors.org_type?.message}>
          <Select id="org_type" required defaultValue="" aria-invalid={!!errors.org_type} {...register("org_type")}>
            <option value="" disabled>Select type...</option>
            <option value="church">Church</option>
            <option value="university">University</option>
            <option value="school">School</option>
          </Select>
        </Field>
        <Field className="sm:col-span-2" label="Contact Name" htmlFor="contact_name" error={errors.contact_name?.message}
               hint="The representative who will place and pay for orders.">
          <Input id="contact_name" autoComplete="name" aria-invalid={!!errors.contact_name} {...register("contact_name")} />
        </Field>
        <Button type="submit" full loading={isSubmitting} className="sm:col-span-2">Submit for approval</Button>
      </form>
    </section>
  );
}