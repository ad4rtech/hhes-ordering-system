"use client";

import { cn } from "@/lib/cn";

export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (next: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        checked ? "bg-primary" : "bg-muted",
      )}>
      <span className={cn("inline-block size-[18px] rounded-full bg-white shadow transition-transform", checked ? "translate-x-[23px]" : "translate-x-[3px]")} />
    </button>
  );
}