import { Banknote, Check, LogIn, Package, PackageCheck, Pencil, ShieldCheck, UserPlus, X, type LucideIcon } from "lucide-react";
import { fmtDayTime } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { Activity, ActivityKind } from "@/lib/rep/dashboard";

const ICON: Record<ActivityKind, LucideIcon> = {
  submitted: Check, paid: Banknote, amended: Pencil, ready: Package, collected: PackageCheck,
  cancelled: X, signin: LogIn, registered: UserPlus, approved: ShieldCheck,
};

export function ActivityCard({ events }: { events: Activity[] }) {
  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface">
      <h2 className="border-b border-line px-6 py-6 font-sans text-lg font-semibold text-ink">Recent Activity</h2>
      <ol className="px-6 py-6">
        {events.map((e, i) => {
          const Icon = ICON[e.kind];
          return (
            <li key={e.id} className="relative flex gap-4 pb-7 last:pb-0">
              {i < events.length - 1 && <span className="absolute left-5 top-11 -bottom-0 w-px bg-line" aria-hidden />}
              <span className={cn("z-10 flex size-10 shrink-0 items-center justify-center rounded-full", i === 0 ? "bg-primary text-white" : "border border-line bg-surface text-muted")}>
                <Icon size={18} strokeWidth={i === 0 ? 2.6 : 2} aria-hidden />
              </span>
              <div className="pt-0.5">
                <p className="text-base font-medium text-ink">{e.title}</p>
                <p className="mt-0.5 text-sm text-muted" suppressHydrationWarning>{fmtDayTime(e.at)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}