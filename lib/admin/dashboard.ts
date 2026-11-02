import type { SupabaseClient } from "@supabase/supabase-js";
import { CATEGORIES } from "./catalogue";
import { stockStatus, type StockStatus } from "@/lib/reports/stock";

export type DQuarter = { id: string; name: string; status: "published" | "closed"; open_date: string; deadline_date: string };
export type FeedKind = "submitted" | "paid" | "ready" | "collected" | "cancelled" | "amended";
export type FeedEvent = { id: string; kind: FeedKind; org: string; orderId: string; at: string };

export type DashboardData = {
  selected: DQuarter | null;
  draftId: string | null;
  stats: { total: number; pendingPickup: number; notOrdered: number; daysLeft: number | null };
  money: { revenue: number; refundsKes: number; refundsCount: number; needsReview: number };
  demand: { slug: string; name: string; stock: number; ordered: number; remaining: number; status: StockStatus }[];
  pickups: { count: number; items: { id: string; reference: string; org: string; readyAt: string; waitingDays: number }[] };
  notOrdered: { total: number; items: { id: string; name: string; type: string; email: string; idleDays: number }[] };
  feed: FeedEvent[];
  overrides: { id: string; organisation: string; reason: string; next: string }[];
};

const nairobiDate = (t: number | string = Date.now()) => new Date((typeof t === "string" ? Date.parse(t) : t) + 3 * 3600_000).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

const EMPTY: Omit<DashboardData, "selected" | "draftId"> = {
  stats: { total: 0, pendingPickup: 0, notOrdered: 0, daysLeft: null },
  money: { revenue: 0, refundsKes: 0, refundsCount: 0, needsReview: 0 },
  demand: [], pickups: { count: 0, items: [] }, notOrdered: { total: 0, items: [] }, feed: [], overrides: [],
};

export async function loadDashboard(sb: SupabaseClient): Promise<DashboardData> {
  const { data: qs } = await sb.from("quarters").select("id,name,status,open_date,deadline_date").order("open_date", { ascending: false });
  const quarters = (qs ?? []) as (Omit<DQuarter, "status"> & { status: "draft" | "published" | "closed" })[];
  const selected = (quarters.find((q) => q.status === "published") ?? quarters.find((q) => q.status === "closed") ?? null) as DQuarter | null;
  const draftId = quarters.find((q) => q.status === "draft")?.id ?? null;
  if (!selected) return { selected: null, draftId, ...EMPTY };

  const [orders, catalogue, orgs, ready, hist, amend, overrides, stats, review] = await Promise.all([
    sb.from("orders").select("organisation_id,status,refund_due,refund_amount_kes,order_items(category_slug,quantity)").eq("quarter_id", selected.id),
    sb.from("catalogue_items").select("category_slug,stock_quantity").eq("quarter_id", selected.id),
    sb.from("organisations").select("id,name,type,contact_email,approved_at").eq("status", "approved"),
    sb.from("orders").select("id,reference,created_at,organisations(name),order_status_history(to_status,changed_at)")
      .eq("quarter_id", selected.id).eq("status", "ready_for_pickup").eq("order_status_history.to_status", "ready_for_pickup"),
    sb.from("order_status_history").select("id,from_status,to_status,changed_at,orders!inner(id,quarter_id,organisations(name))")
      .eq("orders.quarter_id", selected.id).order("changed_at", { ascending: false }).limit(10),
    sb.from("order_amendments").select("id,amended_at,orders!inner(id,quarter_id,organisations(name))")
      .eq("orders.quarter_id", selected.id).order("amended_at", { ascending: false }).limit(10),
    sb.from("deadline_overrides").select("id,new_deadline,reason,organisations(name)")
      .eq("quarter_id", selected.id).order("granted_at", { ascending: false }).limit(3),
    sb.rpc("quarter_stats"),
    sb.from("mpesa_transactions").select("id", { count: "exact", head: true }).eq("needs_review", true).eq("status", "pending"),
  ]);

  const today = nairobiDate();
  type O = { organisation_id: string; status: string; refund_due: boolean; refund_amount_kes: number; order_items: { category_slug: string; quantity: number }[] };
  const all = (orders.data ?? []) as O[];
  const active = all.filter((o) => o.status !== "cancelled");

  // Demand summary
  const stock = new Map(((catalogue.data ?? []) as { category_slug: string; stock_quantity: number }[]).map((c) => [c.category_slug, Number(c.stock_quantity)]));
  const ordered = new Map<string, number>();
  for (const o of active) for (const i of o.order_items) ordered.set(i.category_slug, (ordered.get(i.category_slug) ?? 0) + i.quantity);
  const demand = CATEGORIES.map((c) => {
    const s = stock.get(c.slug) ?? 0, n = ordered.get(c.slug) ?? 0;
    const status = selected.status === "closed" && s === 0 ? "none" : stockStatus(s, n);
    return { slug: c.slug, name: c.name, stock: s, ordered: n, remaining: s - n, status } as const;
  });

  // Not yet ordered, longest idle first
  const orderedOrgs = new Set(active.map((o) => o.organisation_id));
  const missing = ((orgs.data ?? []) as { id: string; name: string; type: string; contact_email: string; approved_at: string | null }[])
    .filter((o) => !orderedOrgs.has(o.id))
    .map((o) => {
      const since = o.approved_at && nairobiDate(o.approved_at) > selected.open_date ? nairobiDate(o.approved_at) : selected.open_date;
      return { id: o.id, name: o.name, type: o.type, email: o.contact_email, idleDays: Math.max(0, daysBetween(since, today)) };
    })
    .sort((a, b) => b.idleDays - a.idleDays || a.name.localeCompare(b.name));

  // Pending pickups, longest waiting first
  type R = { id: string; reference: string; created_at: string; organisations: { name: string } | null; order_status_history: { to_status: string; changed_at: string }[] };
  const pickups = ((ready.data ?? []) as unknown as R[]).map((r) => {
    const readyAt = r.order_status_history.map((h) => h.changed_at).sort().at(-1) ?? r.created_at;
    return { id: r.id, reference: r.reference, org: r.organisations?.name ?? "-", readyAt, waitingDays: Math.max(0, daysBetween(nairobiDate(readyAt), today)) };
  }).sort((a, b) => a.readyAt.localeCompare(b.readyAt));

  // Recent orders feed
  type H = { id: string; from_status: string | null; to_status: string; changed_at: string; orders: { id: string; organisations: { name: string } | null } };
  type A = { id: string; amended_at: string; orders: { id: string; organisations: { name: string } | null } };
  const KIND: Record<string, FeedKind> = { paid: "paid", ready_for_pickup: "ready", collected: "collected", cancelled: "cancelled" };
  const events: FeedEvent[] = [];
  for (const h of (hist.data ?? []) as unknown as H[]) {
    const kind = h.from_status === null ? "submitted" : KIND[h.to_status];
    if (kind) events.push({ id: `h-${h.id}`, kind, org: h.orders.organisations?.name ?? "-", orderId: h.orders.id, at: h.changed_at });
  }
  for (const a of (amend.data ?? []) as unknown as A[])
    events.push({ id: `a-${a.id}`, kind: "amended", org: a.orders.organisations?.name ?? "-", orderId: a.orders.id, at: a.amended_at });
  events.sort((x, y) => y.at.localeCompare(x.at));

  const mine = ((stats.data ?? []) as { quarter_id: string; revenue_kes: number }[]).find((s) => s.quarter_id === selected.id);
  const refunds = all.filter((o) => o.refund_due);

  return {
    selected, draftId,
    stats: {
      total: active.length, pendingPickup: pickups.length, notOrdered: missing.length,
      daysLeft: selected.status === "published" ? daysBetween(today, selected.deadline_date) : null,
    },
    money: {
      revenue: Number(mine?.revenue_kes ?? 0), refundsKes: refunds.reduce((s, o) => s + Number(o.refund_amount_kes), 0),
      refundsCount: refunds.length, needsReview: review.count ?? 0,
    },
    demand: [...demand],
    pickups: { count: pickups.length, items: pickups.slice(0, 5) },
    notOrdered: { total: missing.length, items: missing.slice(0, 3) },
    feed: events.slice(0, 5),
    overrides: ((overrides.data ?? []) as unknown as { id: string; new_deadline: string; reason: string; organisations: { name: string } | null }[])
      .map((x) => ({ id: x.id, organisation: x.organisations?.name ?? "-", reason: x.reason, next: x.new_deadline })),
  };
}