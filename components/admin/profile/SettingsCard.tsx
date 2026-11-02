import type { ReactNode } from "react";

export function SettingsCard({ id, title, subtitle, action, footer, children }: {
  id: string; title: string; subtitle: string; action?: ReactNode; footer?: ReactNode; children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-6 sm:px-8">
        <div>
          <h2 className="font-sans text-lg font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-[15px] text-muted">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="px-6 py-7 sm:px-8">{children}</div>
      {footer && <div className="flex justify-end border-t border-line bg-canvas px-6 py-4 sm:px-8">{footer}</div>}
    </section>
  );
}