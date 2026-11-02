import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-ink sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-2 text-base text-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}