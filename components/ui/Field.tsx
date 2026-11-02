"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Check, ChevronDown, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { PasswordStrength } from "./PasswordStrength";

export const control =
  "h-11 w-full rounded-field border border-line bg-field px-3.5 text-[15px] text-ink placeholder:text-subtle " +
  "transition-colors focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15";

export function Field({ label, htmlFor, error, hint, action, className, children }: {
  label: string; htmlFor: string; error?: string; hint?: string; action?: ReactNode; className?: string; children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[15px] font-medium text-ink">{label}</label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

// Input with a leading icon (the admin login design)
export function IconInput({ icon: Icon, className, ...props }: ComponentProps<"input"> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
      <input className={cn(control, "pl-11", className)} {...props} />
    </div>
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(control, "appearance-none pr-10 invalid:text-subtle [&>option]:text-ink", className)} {...props}>
        {children}
      </select>
      <ChevronDown size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
}

export function PasswordField({ id, label = "Password", error, hint, icon: Icon, showLink = true, meter, ...inputProps }: Omit<ComponentProps<"input">, "type" | "id"> & {
  id: string; label?: string; error?: string; hint?: string; icon?: LucideIcon; showLink?: boolean;
  meter?: { value: string; context?: string[] };
}) {
  const [show, setShow] = useState(false);
  const toggle = () => setShow((s) => !s);
  return (
    <Field
      label={label} htmlFor={id} error={error} hint={meter ? undefined : hint}
      action={showLink ? (
        <button type="button" onClick={toggle} className="text-sm font-medium text-primary hover:underline">
          {show ? "Hide password" : "Show password"}
        </button>
      ) : undefined}
    >
      <div className="relative">
        {Icon && <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />}
        <Input id={id} type={show ? "text" : "password"} className={cn("pr-11", Icon && "pl-11")} aria-invalid={!!error}
               aria-describedby={error ? `${id}-error` : undefined} {...inputProps} />
        <button type="button" onClick={toggle} aria-label={show ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {meter && <PasswordStrength password={meter.value} context={meter.context} />}
    </Field>
  );
}

export function Checkbox({ label, className, ...props }: Omit<ComponentProps<"input">, "type"> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer select-none items-center gap-3 text-[15px] text-ink", className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className="flex size-5 items-center justify-center rounded-md border border-line-strong bg-surface text-primary transition-colors peer-checked:border-primary peer-checked:bg-primary-soft peer-focus-visible:ring-3 peer-focus-visible:ring-primary/25 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
        <Check size={14} strokeWidth={3} aria-hidden />
      </span>
      {label}
    </label>
  );
}