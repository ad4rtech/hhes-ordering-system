import "server-only";
import type { getRepContext } from "./context";

type Ctx = NonNullable<Awaited<ReturnType<typeof getRepContext>>>;

export type MyOrder = {
  id: string; reference: string; status: string; payment_status: string;
  total_amount_kes: number; amount_paid_kes: number; refund_due: boolean; refund_amount_kes: number;
  is_historical: boolean; submitted_at: string | null; created_at: string; quarter_id: string;
  quarters: { name: string; open_date: string } | null;
  order_items: { category_slug: string; quantity: number }[];
};
export type StepDates = { paidAt: string | null; readyAt: string | null; collectedAt: string | null; receipt: string | null };

export async function loadMyOrders(ctx: Ctx) {
  const { sb, window: w } = ctx;

  // Row Level Security limits this to the organisation's own orders
  const { data } = await sb.from("orders")
    .select("id,reference,status,payment_status,total_amount_kes,amount_paid_kes,refund_due,refund_amount_kes,is_historical,submitted_at,created_at,quarter_id,quarters(name,open_date),order_items(category_slug,quantity)")
    .order("created_at", { ascending: false }).limit(100);

  const all = ((data ?? []) as unknown as MyOrder[]).sort((a, b) => (b.quarters?.open_date ?? "").localeCompare(a.quarters?.open_date ?? ""));
  const current = w.quarter ? all.find((o) => o.quarter_id === w.quarter!.id) ?? null : null;
  const history = all.filter((o) => o.id !== current?.id);

  let dates: StepDates = { paidAt: null, readyAt: null, collectedAt: null, receipt: null };
  if (current) {
    const [h, t] = await Promise.all([
      sb.from("order_status_history").select("to_status,changed_at").eq("order_id", current.id),
      sb.from("mpesa_transactions").select("mpesa_receipt_number,transaction_date,created_at")
        .eq("order_id", current.id).eq("status", "success").order("created_at", { ascending: false }).limit(1),
    ]);
    const at = (s: string) => ((h.data ?? []) as { to_status: string; changed_at: string }[]).filter((x) => x.to_status === s).map((x) => x.changed_at).sort().at(-1) ?? null;
    const tx = (t.data ?? [])[0] as { mpesa_receipt_number: string | null; transaction_date: string | null; created_at: string } | undefined;
    dates = { paidAt: tx?.transaction_date ?? tx?.created_at ?? at("paid"), readyAt: at("ready_for_pickup"), collectedAt: at("collected"), receipt: tx?.mpesa_receipt_number ?? null };
  }

  return { current, history, dates };
}