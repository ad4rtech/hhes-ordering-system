import type { LucideIcon } from "lucide-react";

export function PortalGuide({ badgeIcon: BadgeIcon, badge, title, intro, items }: {
  badgeIcon: LucideIcon; badge: string; title: string; intro: string;
  items: { icon: LucideIcon; title: string; body: string }[];
}) {
  return (
    <aside className="rounded-card bg-panel p-6 sm:p-8 lg:p-10">
      <span className="inline-flex items-center gap-2 rounded-xl bg-surface px-3.5 py-2 text-sm font-medium text-ink">
        <BadgeIcon size={16} aria-hidden /> {badge}
      </span>
      <h2 className="mt-7 text-3xl font-bold leading-tight text-ink sm:text-[34px]">{title}</h2>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">{intro}</p>
      <ul className="mt-9 space-y-7">
        {items.map(({ icon: Icon, title: t, body }) => (
          <li key={t} className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-ink"><Icon size={18} aria-hidden /></span>
            <div>
              <h3 className="font-sans text-lg font-medium leading-snug text-ink">{t}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}