"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { api } from "@/lib/api";
import { notify } from "@/lib/notify";
import { CONTACT_TOPICS, contactSchema, type ContactValues } from "@/lib/contact";

export function ContactForm({ prefill, hours }: { prefill: Partial<ContactValues>; hours: string }) {
  const startedAt = useRef(Date.now());
  const honey = useRef<HTMLInputElement>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const { register, handleSubmit, reset, setError, watch, formState: { errors, isSubmitting } } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", organisation: "", message: "", ...prefill },
  });
  const length = (watch("message") ?? "").length;

  const submit = handleSubmit(
    async (values) => {
      const res = await api("/api/contact", { json: { ...values, website: honey.current?.value ?? "", started: startedAt.current }, silent: true });
      if (res.ok) {
        notify("site.contact.sent", { email: values.email });
        setSentTo(values.email);
        reset({ name: "", email: "", phone: "", organisation: "", message: "", ...prefill });
        return;
      }
      if (res.fields) {
        for (const [k, m] of Object.entries(res.fields)) if (m[0]) setError(k as keyof ContactValues, { message: m[0] });
        notify("common.validation");
      } else if (res.status === 429) notify("site.contact.rate_limited");
      else if (res.status === 0) notify("common.network");
      else notify("site.contact.failed");
    },
    () => notify("common.validation"),
  );

  if (sentTo) {
    return (
      <div className="flex flex-col items-center px-2 py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success"><CircleCheck size={32} aria-hidden /></span>
        <h2 className="mt-6 font-sans text-2xl font-semibold text-ink">Message sent</h2>
        <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
          Thank you. We've emailed a copy to <strong className="font-medium text-ink">{sentTo}</strong> and will reply to that address as soon as we can{hours ? ` during office hours (${hours})` : ""}.
        </p>
        <Button variant="outline" className="mt-8" onClick={() => { startedAt.current = Date.now(); setSentTo(null); }}>Send another message</Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
      {/* honeypot: hidden from people and from autofill, tempting to bots */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input ref={honey} type="text" name="hp_field_x7" id="hp_field_x7" tabIndex={-1}
          autoComplete="off" data-lpignore="true" data-1p-ignore="true" data-form-type="other" defaultValue="" />
      </div>

      <Field label="Full name" htmlFor="c-name" error={errors.name?.message}>
        <Input id="c-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field label="Email address" htmlFor="c-email" error={errors.email?.message}>
        <Input id="c-email" type="email" autoComplete="email" placeholder="name@organisation.com" aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field label="Phone (optional)" htmlFor="c-phone" error={errors.phone?.message}>
        <Input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" aria-invalid={!!errors.phone} {...register("phone")} />
      </Field>
      <Field label="Organisation (optional)" htmlFor="c-org" error={errors.organisation?.message}>
        <Input id="c-org" autoComplete="organization" placeholder="e.g. Central SDA Church" aria-invalid={!!errors.organisation} {...register("organisation")} />
      </Field>
      <Field className="sm:col-span-2" label="What is your message about?" htmlFor="c-topic" error={errors.topic?.message}>
        <Select id="c-topic" required defaultValue={prefill.topic ?? ""} aria-invalid={!!errors.topic} {...register("topic")}>
          <option value="" disabled>Choose a topic...</option>
          {CONTACT_TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
      </Field>
      <Field className="sm:col-span-2" label="Message" htmlFor="c-message" error={errors.message?.message}>
        <Textarea id="c-message" rows={6} placeholder="How can we help?" aria-invalid={!!errors.message} {...register("message")} />
        <p className="mt-1.5 text-right text-xs text-muted" aria-live="polite">{length.toLocaleString("en-KE")} / 2,000</p>
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" full loading={isSubmitting}>Send message</Button>
        <p className="mt-4 text-center text-sm text-muted">By sending this you agree to our privacy practices, described in our <a href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</a>.</p>
      </div>
    </form>
  );
}