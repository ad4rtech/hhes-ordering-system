import type { ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "soft" | "ghost" | "positive" | "dangerOutline" | "danger";
type Size = "md" | "sm";

export function buttonStyles({ variant = "primary", size = "md", full = false }: { variant?: Variant; size?: Size; full?: boolean } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-field font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    "disabled:cursor-not-allowed disabled:opacity-60",
    size === "md" ? "h-11 px-5 text-[15px]" : "h-10 px-4 text-sm",
    full && "w-full",
    variant === "primary" && "bg-primary text-white hover:bg-primary-hover",
    variant === "outline" && "border border-line-strong bg-surface text-ink hover:bg-canvas",
    variant === "soft" && "bg-primary-soft text-ink hover:bg-primary-softer",
    variant === "ghost" && "text-muted hover:text-ink",
    variant === "positive" && "bg-positive text-white hover:bg-positive-hover",
    variant === "dangerOutline" && "border border-line-strong bg-surface text-danger-solid hover:bg-danger-soft",
    variant === "danger" && "bg-danger-solid text-white hover:bg-danger",
  );
}

export function Button({
  variant, size, full, loading, className, children, disabled, ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; full?: boolean; loading?: boolean }) {
  return (
    <button className={cn(buttonStyles({ variant, size, full }), className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 size={18} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}