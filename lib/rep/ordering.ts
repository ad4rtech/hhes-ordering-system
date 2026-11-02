import "server-only";
import type { getRepContext } from "./context";
import { REP_TITLE } from "./catalogue";
import { CATEGORIES } from "@/lib/admin/catalogue";
import { canAmend, startBlockedReason } from "./rules";

type Ctx = NonNullable<Awaited<ReturnType<typeof getRepContext>>>;

export type OrderLine = {
  slug: string; name: string; price: number;
  status: "available" | "low" | "out"; left: number | null; qty: number; // qty = what they currently hold (editing)
};

export type OrderFormData =
  | { kind: "blocked"; reason: string }
  | { kind: "existing"; orderId: string; amendable: boolean }
  | { kind: "missing" }
  | { kind: "locked"; orderId: string }
  | { kind: "ready"; lines: OrderLine[]; order: { id: string; reference: string; total: number; paid: number } | null };

export async function loadOrderForm(ctx: Ctx, orderId?: string): Promise<OrderFormData> {
  const { sb, window: w } = ctx;

  if (!orderId) {
    const blocked = startBlockedReason(w);
    if (blocked) return { kind: "blocked", reason: blocked };
    const { data: existing } = await sb.from("orders").select("id,status").eq("quarter_id", w.quarter!.id).maybeSingle();
    if (existing) return { kind: "existing", orderId: existing.id, amendable: canAmend(existing.status, w) };
  }

  let order: { id: string; reference: string; total: number; paid: number } | null = null;
  const held = new Map<string, number>();
  if (orderId) {
    const { data } = await sb.from("orders")
      .select("id,reference,status,quarter_id,total_amount_kes,amount_paid_kes,order_items(category_slug,quantity)")
      .eq("id", orderId).maybeSingle();
    if (!data) return { kind: "missing" };
    if (data.quarter_id !== w.quarter?.id || !canAmend(data.status, w)) return { kind: "locked", orderId };
    order = { id: data.id, reference: data.reference, total: Number(data.total_amount_kes), paid: Number(data.amount_paid_kes) };
    for (const i of data.order_items as { category_slug: string; quantity: number }[]) held.set(i.category_slug, i.quantity);
  }

  // Availability for this organisation (when editing, its own books count as available to it)
  const { data: av } = await sb.rpc("rep_availability", { p_exclude_order: orderId ?? null });
  const rows = new Map(((av ?? []) as { category_slug: string; price_kes: number; status: OrderLine["status"]; left_units: number | null }[]).map((r) => [r.category_slug, r]));
  if (rows.size === 0) return { kind: "blocked", reason: "The catalogue isn't available yet" };

  const lines: OrderLine[] = CATEGORIES.filter((c) => rows.has(c.slug)).map((c) => {
    const r = rows.get(c.slug)!;
    return { slug: c.slug, name: REP_TITLE[c.slug] ?? c.name, price: Number(r.price_kes), status: r.status, left: r.left_units, qty: held.get(c.slug) ?? 0 };
  });
  return { kind: "ready", lines, order };
}