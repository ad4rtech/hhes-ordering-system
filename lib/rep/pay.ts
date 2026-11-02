import "server-only";
import type { getRepContext } from "./context";

type Ctx = NonNullable<Awaited<ReturnType<typeof getRepContext>>>;

export type PayTx = {
  id: string; amount_kes: number; status: "pending" | "success" | "failed" | "timeout"; result_code: number | null; result_desc: string | null;
  mpesa_receipt_number: string | null; transaction_date: string | null; created_at: string; phone_number: string; needs_review: boolean;
};
export type PayOrder = {
  id: string; reference: string; status: string; payment_status: string; total_amount_kes: number; amount_paid_kes: number;
  quarters: { name: string } | null; order_items: { category_slug: string; quantity: number; unit_price_kes: number }[];
};

export async function loadPay(ctx: Ctx, orderId: string) {
  const { sb, org, window: w } = ctx;
  const [o, t] = await Promise.all([
    sb.from("orders").select("id,reference,status,payment_status,total_amount_kes,amount_paid_kes,quarters(name),order_items(category_slug,quantity,unit_price_kes)")
      .eq("id", orderId).maybeSingle(),
    sb.from("mpesa_transactions")
      .select("id,amount_kes,status,result_code,result_desc,mpesa_receipt_number,transaction_date,created_at,phone_number,needs_review")
      .eq("order_id", orderId).order("created_at", { ascending: false }).limit(10),
  ]);
  if (!o.data) return null;
  return { order: o.data as unknown as PayOrder, tx: (t.data ?? []) as PayTx[], savedPhone: org.mpesa_phone as string | null, state: w.state, deadline: w.deadline };
}