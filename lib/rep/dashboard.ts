import "server-only";
import type { getRepContext } from "./context";

type Ctx = NonNullable<Awaited<ReturnType<typeof getRepContext>>>;

export type DOrder = {
  id: string; reference: string; status: string; payment_status: string;
  total_amount_kes: number; amount_paid_kes: number; refund_due: boolean; refund_amount_kes: number;
  submitted_at: string | null; quarter_id: string; quarters: { name: string } | null;
  order_items: { category_slug: string; quantity: number; unit_price_kes: number }[];
};
export type ActivityKind = "submitted" | "paid" | "amended" | "ready" | "collected" | "cancelled" | "signin" | "registered" | "approved";
export type Activity = { id: string; kind: ActivityKind; title: string; at: string };

const TITLE: Record<ActivityKind, string> = {
  submitted: "Order submitted", paid: "Payment received", amended: "Order amended", ready: "Order ready for pickup",
  collected: "Order collected", cancelled: "Order cancelled", signin: "Signed in securely",
  registered: "Account registered", approved: "Account approved",
};
const FROM_STATUS: Record<string, ActivityKind> = { paid: "paid", ready_for_pickup: "ready", collected: "collected", cancelled: "cancelled" };

const SELECT = "id,reference,status,payment_status,total_amount_kes,amount_paid_kes,refund_due,refund_amount_kes,submitted_at,quarter_id,quarters(name),order_items(category_slug,quantity,unit_price_kes)";

export async function loadRepDashboard(ctx: Ctx) {
  const { sb, user, org, window: w } = ctx;

  // Row Level Security already limits all of this to the organisation's own data
  const [recent, hist, amend] = await Promise.all([
    sb.from("orders").select(SELECT).order("created_at", { ascending: false }).limit(6),
    sb.from("order_status_history").select("id,from_status,to_status,changed_at").order("changed_at", { ascending: false }).limit(12),
    sb.from("order_amendments").select("id,amended_at").order("amended_at", { ascending: false }).limit(6),
  ]);

  const orders = (recent.data ?? []) as unknown as DOrder[];
  const current = orders.find((o) => o.quarter_id === w.quarter?.id) ?? (w.quarter ? null : orders[0] ?? null);
  const past = orders.find((o) => o.id !== current?.id && o.quarter_id !== w.quarter?.id) ?? null;

  const events: Activity[] = [];
  for (const h of (hist.data ?? []) as { id: string; from_status: string | null; to_status: string; changed_at: string }[]) {
    const kind = h.from_status === null ? "submitted" : FROM_STATUS[h.to_status];
    if (kind) events.push({ id: `h-${h.id}`, kind, title: TITLE[kind], at: h.changed_at });
  }
  for (const a of (amend.data ?? []) as { id: string; amended_at: string }[])
    events.push({ id: `a-${a.id}`, kind: "amended", title: TITLE.amended, at: a.amended_at });
  if (user.last_sign_in_at) events.push({ id: "signin", kind: "signin", title: TITLE.signin, at: user.last_sign_in_at });
  if (org.approved_at) events.push({ id: "approved", kind: "approved", title: TITLE.approved, at: org.approved_at });
  events.push({ id: "registered", kind: "registered", title: TITLE.registered, at: org.created_at });
  events.sort((a, b) => b.at.localeCompare(a.at));

  return { current, past, activity: events.slice(0, 5) };
}