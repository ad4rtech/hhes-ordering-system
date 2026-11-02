import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "soft" | "success" | "successSoft" | "plain" | "danger" | "dangerSoft" | "attention" | "warning" | "info" | "neutral";

const TONES: Record<BadgeTone, string> = {
  soft: "bg-panel font-semibold text-ink",
  success: "border border-success bg-surface font-medium text-success",
  successSoft: "bg-success-soft font-medium text-success",
  plain: "font-medium text-ink",
  danger: "bg-danger-solid font-medium text-white",
  dangerSoft: "bg-danger-soft font-medium text-danger",
  attention: "bg-attention font-semibold text-white",
  warning: "bg-warning-soft font-medium text-warning",
  info: "bg-primary-soft font-medium text-primary",
    positive: "bg-positive font-semibold text-white",
  neutral: "bg-canvas font-medium text-muted",
};

export function Badge({ tone = "soft", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-[13px] leading-none", TONES[tone], className)}>{children}</span>;
}