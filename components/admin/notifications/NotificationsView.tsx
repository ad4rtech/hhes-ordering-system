"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Banknote, BellOff, BellRing, CheckCheck, ChevronDown, CircleX, Clock, Funnel, ShieldCheck, Trash2, TriangleAlert, Undo2, UserPlus, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Rich } from "@/lib/notifications/rich";
import { FILTERS, type NotificationType } from "@/lib/notifications/types";
import { deleteNotification, markAllRead, markRead } from "@/lib/notifications/actions";
import { useLiveRefresh } from "@/lib/useLiveRefresh";
import { useUrlParams } from "@/lib/useUrlParams";
import { notify } from "@/lib/notify";
import { fmtNotifTime } from "@/lib/utils/format";
import { cn } from "@/lib/cn";

export type NotificationItem = {
  id: string; type: NotificationType; title: string; body: string;
  link: string | null; action_label: string | null; read_at: string | null; created_at: string;
};

const LIVE = ["notifications"];
const META: Record<NotificationType, { icon: LucideIcon; wrap: string }> = {
  org_registration: { icon: UserPlus, wrap: "bg-primary-soft text-primary" },
  critical_stock: { icon: TriangleAlert, wrap: "bg-danger-solid text-white" },
  order_cancelled: { icon: CircleX, wrap: "text-muted" },
  override_granted: { icon: ShieldCheck, wrap: "bg-positive text-white" },
  override_used: { icon: ShieldCheck, wrap: "bg-positive text-white" },
  reminders_sent: { icon: BellRing, wrap: "bg-attention text-white" },
  payment_review: { icon: Banknote, wrap: "bg-amber-500 text-white" },
  refund_due: { icon: Undo2, wrap: "bg-danger-soft text-danger" },
};

export function NotificationsView({ items, total, unread, filter, limit }: {
  items: NotificationItem[]; total: number; unread: number; filter: string; limit: number;
}) {
  const { update, refresh, isPending } = useUrlParams();
  const [read, setRead] = useState<Set<string>>(new Set());
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [busyAll, setBusyAll] = useState(false);
  useLiveRefresh(LIVE);

  // fresh data from the server replaces the optimistic state
  useEffect(() => { setRead(new Set()); setGone(new Set()); }, [items]);

  const shown = items.filter((n) => !gone.has(n.id));
  const unreadNow = Math.max(unread - read.size, 0);

  async function onRead(id: string) {
    setRead((s) => new Set(s).add(id));
    if (await markRead(id)) refresh();
    else { setRead((s) => { const c = new Set(s); c.delete(id); return c; }); notify("admin.notifications.failed"); }
  }
  async function onDelete(id: string) {
    setGone((s) => new Set(s).add(id));
    if (await deleteNotification(id)) { notify("admin.notifications.deleted"); refresh(); }
    else { setGone((s) => { const c = new Set(s); c.delete(id); return c; }); notify("admin.notifications.failed"); }
  }
  async function onAll() {
    setBusyAll(true);
    const n = await markAllRead();
    setBusyAll(false);
    if (n === null) notify("admin.notifications.failed");
    else { notify("admin.notifications.all_read", { count: n }); refresh(); }
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-ink sm:text-[32px]">System Notifications</h1>
            {unreadNow > 0 && <Badge tone="info" className="bg-primary text-white">{unreadNow} Unread</Badge>}
          </div>
          <p className="mt-2 text-base text-muted">Manage operational alerts, registrations, and order updates.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex h-11 items-center gap-2 rounded-field border border-line bg-surface pl-3.5 pr-9 text-[15px] focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
            <Funnel size={16} className="text-muted" aria-hidden />
            <select value={filter} onChange={(e) => update({ filter: e.target.value === "all" ? undefined : e.target.value, limit: undefined })}
              aria-label="Filter notifications" className="cursor-pointer appearance-none bg-transparent font-medium text-ink focus:outline-none">
              {Object.entries(FILTERS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 text-muted" aria-hidden />
          </label>
          <Button variant="outline" loading={busyAll} disabled={unreadNow === 0} onClick={onAll}><CheckCheck size={18} aria-hidden /> Mark all as read</Button>
        </div>
      </div>

      <section className={cn("overflow-hidden rounded-card border border-line bg-surface transition-opacity", isPending && "opacity-60")}>
        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-panel text-muted"><BellOff size={24} aria-hidden /></span>
            <h2 className="font-sans text-lg font-semibold text-ink">{filter === "all" ? "You're all caught up" : "Nothing here"}</h2>
            <p className="max-w-sm text-[15px] leading-relaxed text-muted">
              {filter === "all" ? "New registrations, stock alerts, cancellations and payment issues will show up here." : "No notifications match this filter."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((n) => {
              const m = META[n.type];
              const Icon = m.icon;
              const isUnread = !n.read_at && !read.has(n.id);
              return (
                <li key={n.id} className={cn("flex gap-5 border-l-4 px-6 py-6 sm:px-8", isUnread ? "border-l-primary bg-panel/60" : "border-l-transparent")}>
                  <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-full", m.wrap)}><Icon size={n.type === "order_cancelled" ? 28 : 24} aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                      <h2 className="font-sans text-lg font-semibold leading-snug text-ink">{n.title}</h2>
                      <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted" suppressHydrationWarning><Clock size={15} aria-hidden /> {fmtNotifTime(n.created_at)}</span>
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted"><Rich text={n.body} /></p>
                    <div className="mt-4 flex items-center gap-3">
                      {n.link && (
                        <Link href={n.link} onClick={() => { if (isUnread) markRead(n.id); }} className={buttonStyles({ variant: "outline", size: "sm" })}>
                          {n.action_label ?? "Open"}
                        </Link>
                      )}
                      {isUnread && <button type="button" onClick={() => onRead(n.id)} className="px-1 text-[15px] font-medium text-primary hover:underline">Mark as read</button>}
                      <button type="button" onClick={() => onDelete(n.id)} aria-label={`Delete notification: ${n.title}`}
                        className="ml-auto flex size-9 items-center justify-center rounded-field text-muted hover:bg-canvas hover:text-danger-solid">
                        <Trash2 size={18} aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {items.length < total && (
          <div className="border-t border-line p-4 text-center">
            <Button variant="outline" size="sm" disabled={isPending} onClick={() => update({ limit: String(limit + 20) })}>Show older notifications</Button>
          </div>
        )}
      </section>
    </div>
  );
}