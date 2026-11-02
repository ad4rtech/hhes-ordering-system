import type { SupabaseClient } from "@supabase/supabase-js";

export type OrderStatus = "awaiting_payment" | "paid" | "ready_for_pickup" | "collected" | "cancelled";
export type OQuarter = { id: string; name: string; status: "published" | "closed"; open_date: string; deadline_date: string };

export type OrderListRow = {
  id: string; reference: string; status: OrderStatus; payment_status: "awaiting_payment" | "paid" | "failed";
  total_amount_kes: number; amount_paid_kes: number; refund_due: boolean; refund_amount_kes: number;
  is_historical: boolean; submitted_at: string | null; created_at: string;
  organisation: { id: string; name: string; type: string }; units: number; categories: number;
};

export type OrderDetail = {
  id: string; reference: string; status: OrderStatus; payment_status: "awaiting_payment" | "paid" | "failed";
  total_amount_kes: number; amount_paid_kes: number; refund_due: boolean; refund_amount_kes: number;
  is_historical: boolean; submitted_at: string | null; collected_at: string | null; created_at: string;
  quarters: { name: string; deadline_date: string } | null;
  organisations: { name: string; type: string; contact_name: string; contact_email: string; mpesa_phone: string | null } | null;
  order_items: { category_slug: string; quantity: number; unit_price_kes: number }[];
  order_amendments: { id: string; previous_data: { items: Record<string, number>; total_amount_kes: number }; new_data: { items: Record<string, number>; total_amount_kes: number }; payment_adjustment: string | null; amended_at: string }[];
  order_status_history: { from_status: string | null; to_status: string; changed_at: string }[];
  mpesa_transactions: { id: string; amount_kes: number; status: string; result_desc: string | null; mpesa_receipt_number: string | null; transaction_date: string | null; created_at: string; phone_number: string; needs_review: boolean; review_note: string | null }[];
};

export type OrdersContext = { quarters: OQuarter[]; selected: OQuarter | null; needsReview: number };
export type OrdersQuery = { q?: string; status?: string; type?: string; page?: number };
export type OrdersData = {
  rows: OrderListRow[]; count: number; page: number; pageSize: number;
  progress: { submitted: number; target: number; awaitingPayment: number; toPrepare: number; ready: number; collected: number; refundsDue: number; daysLeft: number | null };
  notOrdered: { total: number; preview: { id: string; name: string; type: string; email: string }[] };
};

const PAGE_SIZE = 10;
const STATUSES = ["awaiting_payment", "paid", "ready_for_pickup", "collected", "cancelled"];
const TYPES = ["church", "university", "school"];
const today = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

export async function loadOrderContext(sb: SupabaseClient, quarterId?: string): Promise<OrdersContext> {
  const [qs, review] = await Promise.all([
    sb.from("quarters").select("id,name,status,open_date,deadline_date").neq("status", "draft").order("open_date", { ascending: false }),
    sb.from("mpesa_transactions").select("id", { count: "exact", head: true }).eq("needs_review", true).eq("status", "pending"),
  ]);
  const quarters = (qs.data ?? []) as OQuarter[];
  const selected = quarters.find((q) => q.id === quarterId) ?? quarters.find((q) => q.status === "published") ?? quarters[0] ?? null;
  return { quarters, selected, needsReview: review.count ?? 0 };
}

export async function loadOrders(sb: SupabaseClient, quarter: OQuarter, p: OrdersQuery): Promise<OrdersData> {
  const page = Math.max(Math.floor(p.page ?? 1) || 1, 1);

  let q = sb.from("orders").select(
    "id,reference,status,payment_status,total_amount_kes,amount_paid_kes,refund_due,refund_amount_kes,is_historical,submitted_at,created_at,organisation_id,organisations!inner(name,type),order_items(quantity)",
    { count: "exact" },
  ).eq("quarter_id", quarter.id);

  const s = p.status ?? "";
  if (s === "") q = q.neq("status", "cancelled");                       // "All Active"
  else if (STATUSES.includes(s)) q = q.eq("status", s);
  else if (s === "payment_failed") q = q.eq("status", "awaiting_payment").eq("payment_status", "failed");
  else if (s === "refund_due") q = q.eq("refund_due", true);            // "all" adds no filter
  if (p.type && TYPES.includes(p.type)) q = q.eq("organisations.type", p.type);

  // Search order reference or organisation name
  const term = (p.q ?? "").replace(/[%,()*\\:"']/g, " ").trim();
  if (term) {
    const { data: m } = await sb.from("organisations").select("id").ilike("name", `%${term}%`).limit(200);
    const ids = (m ?? []).map((o) => o.id);
    q = q.or(`reference.ilike.%${term}%${ids.length ? `,organisation_id.in.(${ids.join(",")})` : ""}`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const [list, stats, orgs] = await Promise.all([
    q.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1),
    sb.from("orders").select("organisation_id,status,refund_due").eq("quarter_id", quarter.id),
    sb.from("organisations").select("id,name,type,contact_email").eq("status", "approved").order("name"),
  ]);
  if (list.error) throw new Error(list.error.message);

  type Raw = Omit<OrderListRow, "organisation" | "units" | "categories"> & { organisation_id: string; organisations: { name: string; type: string }; order_items: { quantity: number }[] };
  const rows = ((list.data ?? []) as unknown as Raw[]).map(({ organisation_id, organisations, order_items, ...o }) => ({
    ...o, organisation: { id: organisation_id, ...organisations },
    units: order_items.reduce((n, i) => n + i.quantity, 0), categories: order_items.filter((i) => i.quantity > 0).length,
  }));

  const all = (stats.data ?? []) as { organisation_id: string; status: string; refund_due: boolean }[];
  const active = all.filter((o) => o.status !== "cancelled");
  const count = (st: string) => all.filter((o) => o.status === st).length;
  const orderedOrgs = new Set(active.map((o) => o.organisation_id));
  const missing = ((orgs.data ?? []) as { id: string; name: string; type: string; contact_email: string }[]).filter((o) => !orderedOrgs.has(o.id));

  return {
    rows, count: list.count ?? 0, page, pageSize: PAGE_SIZE,
    progress: {
      submitted: active.length, target: (orgs.data ?? []).length,
      awaitingPayment: count("awaiting_payment"), toPrepare: count("paid"), ready: count("ready_for_pickup"), collected: count("collected"),
      refundsDue: all.filter((o) => o.refund_due).length,
      daysLeft: quarter.status === "published" ? daysBetween(today(), quarter.deadline_date) : null,
    },
    notOrdered: { total: missing.length, preview: missing.slice(0, 5).map((o) => ({ id: o.id, name: o.name, type: o.type, email: o.contact_email })) },
  };
}