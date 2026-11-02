"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markAllRead, markRead } from "@/lib/notifications/actions";
import { useUnreadCount } from "@/lib/useUnreadCount";
import { Rich } from "@/lib/notifications/rich";
import { notify } from "@/lib/notify";
import { fmtNotifTime } from "@/lib/utils/format";
import { cn } from "@/lib/cn";

type Item = { id: string; title: string; body: string; link: string | null; read_at: string | null; created_at: string };

export function RepBell({ userId, initial }: { userId: string; initial: number }) {
  const router = useRouter();
  const unread = useUnreadCount(initial, userId, "Check the bell for the details.");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await createClient().from("notifications")
      .select("id,title,body,link,read_at,created_at").order("created_at", { ascending: false }).limit(8);
    setItems((data ?? []) as Item[]);
  }, []);

  useEffect(() => { if (open) load(); }, [open, unread, load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  async function go(n: Item) {
    if (!n.read_at) await markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }
  async function readAll() {
    const c = await markAllRead();
    if (c === null) notify("admin.notifications.failed"); else { notify("admin.notifications.all_read", { count: c }); load(); }
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative flex size-10 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink">
        <Bell size={22} aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-danger-solid px-1 text-[11px] font-semibold leading-[18px] text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 top-full z-40 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-line bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-sans text-base font-semibold text-ink">Notifications</h2>
            <button type="button" disabled={unread === 0} onClick={readAll} className="text-sm font-medium text-primary hover:underline disabled:text-muted disabled:no-underline">Mark all as read</button>
          </div>
          {items === null ? (
            <div className="space-y-3 p-5" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-field bg-canvas" />)}</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <BellOff size={22} className="text-muted" aria-hidden />
              <p className="text-[15px] text-muted">No notifications yet.</p>
            </div>
          ) : (
            <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => go(n)} className={cn("flex w-full gap-3 px-5 py-4 text-left hover:bg-canvas", !n.read_at && "bg-panel/60")}>
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-primary")} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium leading-snug text-ink">{n.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-sm leading-relaxed text-muted"><Rich text={n.body} strong="font-semibold text-ink" /></span>
                      <span className="mt-1 block text-xs text-muted" suppressHydrationWarning>{fmtNotifTime(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}