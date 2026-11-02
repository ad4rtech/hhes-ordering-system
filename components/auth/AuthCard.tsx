import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function AuthCard({ icon: Icon, tone = "brand", accent = false, title, subtitle, children }: {
  icon: LucideIcon; tone?: "brand" | "success"; accent?: boolean; title: string; subtitle?: ReactNode; children: ReactNode;
}) {
  return (
    <div className={cn(
      "mx-auto w-full max-w-[480px] overflow-hidden rounded-card border border-line bg-surface p-6 shadow-sm sm:p-10",
      accent && "border-t-4 border-t-primary",
    )}>
      <div className="flex flex-col items-center text-center">
        <span className={cn(
          "flex size-14 items-center justify-center rounded-xl border",
          tone === "success" ? "border-success/20 bg-success-soft text-success" : "border-line bg-surface text-primary",
        )}>
          <Icon size={26} aria-hidden />
        </span>
        <h1 className="mt-6 text-3xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-3 text-base leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}