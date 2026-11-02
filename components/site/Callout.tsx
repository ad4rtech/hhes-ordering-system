import type { ReactNode } from "react";
import { Info, Lightbulb, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const TONES: Record<"info" | "tip" | "warn", { bg: string; icon: string; Icon: LucideIcon }> = {
  info: { bg: "bg-panel", icon: "text-primary", Icon: Info },
  tip: { bg: "bg-success-soft", icon: "text-success", Icon: Lightbulb },
  warn: { bg: "bg-warning-soft", icon: "text-warning", Icon: TriangleAlert },
};

export function Callout({ tone = "info", title, children }: { tone?: "info" | "tip" | "warn"; title: string; children: ReactNode }) {
  const { bg, icon, Icon } = TONES[tone];
  return (
    <div className={cn("flex gap-3 rounded-field px-5 py-4 text-[15px] leading-relaxed", bg)}>
      <Icon size={20} className={cn("mt-0.5 shrink-0", icon)} aria-hidden />
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <div className="mt-1 space-y-2 text-muted">{children}</div>
      </div>
    </div>
  );
}