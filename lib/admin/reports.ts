import type { SupabaseClient } from "@supabase/supabase-js";
import { CATEGORIES } from "./catalogue";
import { stockStatus, type StockStatus } from "@/lib/reports/stock";

export type RQuarter = { id: string; name: string; status: "published" | "closed"; open_date: string };

export type ReportData = {
  quarters: RQuarter[];
  selected: RQuarter | null;
  stats: {
    total: number; awaitingPayment: number; paid: number; pending: number;
    ready: number; collected: number; fulfilled: number; cancelled: number; refundsDue: number;
    previousTotal: number | null;
  };
  demand: { slug: string; name: string; ordered: number; stock: number; variance: number; status: StockStatus }[];
  notOrdered: { id: string; name: string; type: string; email: string }[];
  overrides: { id: string; organisation: string; granted_at: string; original: string; next: string; reason: string; by: string }[];
};

const EMPTY_STATS: ReportData["stats"] = {
  total: 0, awaitingPayment: 0, paid: 0, pending: 0, ready: 0, collected: 0, fulfilled: 0, cancelled: 0, refundsDue: 0, previousTotal: null,
};

export async function loadReports(sb: SupabaseClient, quarterId?: string): Promise<ReportData> {
  const { data: qs } = await sb.from("quarters").select("id,name,status,open_date").neq("status", "draft").order("open_date", { ascending: false });
  const quarters = (qs ?? []) as RQuarter[];
  const selected = quarters.find((q) => q.id === quarterId) ?? quarters.find((q) => q.status === "published") ?? quarters[0] ?? null;
  if (!selected) return { quarters, selected: null, stats: EMPTY_STATS, demand: [], notOrdered: [], overrides: [] };

  const previous = quarters.find((q) => q.open_date < selected.open_date) ?? null; // sorted newest first

  const [orders, catalogue, orgs, overrides, prevCount] = await Promise.all([
    sb.from("orders").select("organisation_id,status,refund_due,order_items(category_slug,quantity)").eq("quarter_id", selected.id),
    sb.from("catalogue_items").select("category_slug,stock_quantity").eq("quarter_id", selected.id),
    sb.from("organisations").select("id,name,type,contact_email").eq("status", "approved").order("name"),
    sb.from("deadline_overrides")
      .select("id,original_deadline,new_deadline,reason,granted_at,organisations(name),granted_by_profile:profiles!granted_by(full_name)")
      .eq("quarter_id", selected.id).order("granted_at", { ascending: false }).limit(5),
    previous
      ? sb.from("orders").select("id", { count: "exact", head: true }).eq("quarter_id", previous.id)
      : Promise.resolve({ count: null as number | null }),
  ]);

  type O = { organisation_id: string; status: string; refund_due: boolean; order_items: { category_slug: string; quantity: number }[] };
  const all = (orders.data ?? []) as O[];
  const active = all.filter((o) => o.status !== "cancelled");
  const count = (s: string) => all.filter((o) => o.status === s).length;

  const stats = {
    total: all.length,
    awaitingPayment: count("awaiting_payment"), paid: count("paid"),
    pending: count("awaiting_payment") + count("paid"),
    ready: count("ready_for_pickup"), collected: count("collected"),
    fulfilled: count("ready_for_pickup") + count("collected"),
    cancelled: count("cancelled"),
    refundsDue: all.filter((o) => o.refund_due).length,
    previousTotal: prevCount.count,
  };

  const stock = new Map(((catalogue.data ?? []) as { category_slug: string; stock_quantity: number }[]).map((c) => [c.category_slug, Number(c.stock_quantity)]));
  const ordered = new Map<string, number>();
  for (const o of active) for (const i of o.order_items) ordered.set(i.category_slug, (ordered.get(i.category_slug) ?? 0) + i.quantity);

  const demand = CATEGORIES.map((c) => {
    const s = stock.get(c.slug) ?? 0;
    const n = ordered.get(c.slug) ?? 0;
    // Imported history has no stock records: show "No stock set" rather than a false alarm
    const status = selected.status === "closed" && s === 0 ? "none" : stockStatus(s, n);
    return { slug: c.slug, name: c.name, ordered: n, stock: s, variance: s - n, status };
  });

  const orderedOrgs = new Set(active.map((o) => o.organisation_id));
  const notOrdered = ((orgs.data ?? []) as { id: string; name: string; type: string; contact_email: string }[])
    .filter((o) => !orderedOrgs.has(o.id))
    .map((o) => ({ id: o.id, name: o.name, type: o.type, email: o.contact_email }));

  type X = { id: string; original_deadline: string; new_deadline: string; reason: string; granted_at: string; organisations: { name: string } | null; granted_by_profile: { full_name: string | null } | null };
  const log = ((overrides.data ?? []) as unknown as X[]).map((x) => ({
    id: x.id, organisation: x.organisations?.name ?? "-", granted_at: x.granted_at,
    original: x.original_deadline, next: x.new_deadline, reason: x.reason, by: x.granted_by_profile?.full_name ?? "An admin",
  }));

  return { quarters, selected, stats, demand, notOrdered, overrides: log };
}