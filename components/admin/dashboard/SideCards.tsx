"use client";

import { useState } from "react";
import Link from "next/link";
import { Banknote, Check, Package, PackageCheck, Pencil, Send, X, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { remindOrg } from "@/lib/admin/reminderActions";
import { fmtDate, timeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { DashboardData, FeedKind } from "@/lib/admin/dashboard";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const Card = ({ title, aside, children }: { title: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) => (
  <section className="overflow-hidden rounded-card border border-line bg-surface">
    <div className="flex items-center justify-between gap-3 px-6 py-5">{typeof title === "string" ? <h2 className="font-sans text-lg font-semibold text-ink">{title}</h2> : title}{aside}</div>
    <div className="border-t border-line">{children}</div>
  </section>
);

export function NotYetOrderedCard({ data, quarterId, canRemind }: { data: DashboardData["notOrdered"]; quarterId: string; canRemind: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  async function remind(o: { id: string; name: string }) {
    setBusy(o.id);
    const r = await remindOrg(o, quarterId);
    setBusy(null);
    if (r !== "failed") setSent((s) => new Set(s).add(o.id));
  }

  return (
    <Card title={<div className="flex items-center gap-3"><h2 className="font-sans text-lg font-semibold text-ink">Not Yet Ordered</h2><Badge tone="soft">{data.total} Orgs</Badge></div>}>
      {data.items.length === 0 ? (
        <p className="px-6 py-8 text-center text-[15px] text-muted">Every approved organisation has ordered.</p>
      ) : (
        <ul className="divide-y divide-line">
          {data.items.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 px-6 py-4">
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-ink">{o.name}</p>
                <p className="truncate text-sm text-muted">{cap(o.type)} • {o.email}</p>
                {canRemind && <p className="mt-1 text-sm font-medium text-attention">{o.idleDays === 0 ? "No activity yet" : `No activity for ${o.idleDays} ${o.idleDays === 1 ? "day" : "days"}`}</p>}
              </div>
              <button type="button" disabled={!canRemind || busy === o.id || sent.has(o.id)} onClick={() => remind(o)}
                aria-label={`Send a reminder to ${o.name}`} title={sent.has(o.id) ? "Reminder sent" : canRemind ? "Send reminder" : "This quarter isn't open"}
                className="flex size-10 shrink-0 items-center justify-center rounded-field border border-line-strong text-ink hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50">
                {sent.has(o.id) ? <Check size={16} aria-hidden /> : <Send size={16} aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
      {data.total > data.items.length && (
        <Link href={`/admin/reports?quarter=${quarterId}`} className="block border-t border-line px-6 py-3 text-center text-sm font-medium text-primary hover:underline">See all {data.total}</Link>
      )}
    </Card>
  );
}

const FEED: Record<FeedKind, { icon: LucideIcon; circle: string; text: string }> = {
  submitted: { icon: Check, circle: "bg-positive text-white", text: "submitted an order" },
  paid: { icon: Banknote, circle: "bg-success-soft text-success", text: "paid for an order" },
  ready: { icon: Package, circle: "bg-attention text-white", text: "order marked ready for pickup" },
  collected: { icon: PackageCheck, circle: "bg-primary text-white", text: "marked as collected" },
  cancelled: { icon: X, circle: "bg-danger-solid text-white", text: "cancelled an order" },
  amended: { icon: Pencil, circle: "bg-amber-500 text-white", text: "amended an order" },
};

export function FeedCard({ feed, quarterId }: { feed: DashboardData["feed"]; quarterId: string }) {
  return (
    <Card title="Recent Orders Feed">
      {feed.length === 0 ? (
        <p className="px-6 py-8 text-center text-[15px] text-muted">Order activity will show up here.</p>
      ) : (
        <ul className="space-y-5 px-6 py-5">
          {feed.map((e) => {
            const f = FEED[e.kind];
            const Icon = f.icon;
            return (
              <li key={e.id} className="flex items-start gap-4">
                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", f.circle)}><Icon size={18} strokeWidth={2.4} aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-snug text-ink"><strong className="font-semibold">{e.org}</strong> {f.text}</p>
                  <p className="mt-1 text-sm text-muted" suppressHydrationWarning>{timeAgo(e.at)}</p>
                </div>
                <Link href={`/admin/orders?quarter=${quarterId}&status=all&order=${e.orderId}`} className="shrink-0 text-sm text-muted hover:text-ink">View</Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function OverrideCard({ overrides }: { overrides: DashboardData["overrides"] }) {
  return (
    <Card title="Override Audit" aside={<Link href="/admin/quarters#extensions" className="text-[15px] font-medium text-primary hover:underline">View Full Log</Link>}>
      {overrides.length === 0 ? (
        <p className="px-6 py-8 text-center text-[15px] text-muted">No deadline extensions this quarter.</p>
      ) : (
        <ul className="divide-y divide-line">
          {overrides.map((o) => (
            <li key={o.id} className="flex items-start justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <p className="text-base font-medium text-ink">{o.organisation}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">Reason: {o.reason}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm text-muted">Extended to</p>
                <p className="text-[15px] font-semibold text-primary">{fmtDate(o.next)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}