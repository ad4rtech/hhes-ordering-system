import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Alert({ tone = "error", children, className }: { tone?: "error" | "success" | "warning"; children: ReactNode; className?: string }) {
  return (
    <div role="alert" className={cn(
      "rounded-field border px-4 py-3 text-sm leading-relaxed",
      tone === "error" && "border-danger/20 bg-danger-soft text-danger",
      tone === "success" && "border-success/20 bg-success-soft text-success",
      tone === "warning" && "border-warning/20 bg-warning-soft text-warning",
      className,
    )}>{children}</div>
  );
}