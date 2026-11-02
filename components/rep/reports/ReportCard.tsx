import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ReportCard({ title, subtitle, action, children, className }: {
  title: string; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={cn("rounded-card border border-line bg-surface p-6 sm:p-8", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="font-sans text-xl font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}