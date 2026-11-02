import type { SupabaseClient } from "@supabase/supabase-js";

export type PaymentRow = {
  id: string; order_id: string; created_at: string; transaction_date: string | null; amount_kes: number;
  status: "pending" | "success" | "failed" | "timeout"; mpesa_receipt_number: string | null; phone_number: string;
  result_desc: string | null; needs_review: boolean; review_note: string | null;
  orders: { reference: string; organisations: { name: string } };
};

export type PaymentsData = {
  rows: PaymentRow[]; count: number; page: number; pageSize: number; review: PaymentRow[];
  summary: { successKes: number; successCount: number; failedCount: number; reviewCount: number };
};

const PAGE_SIZE = 15;
const COLS = "id,order_id,created_at,transaction_date,amount_kes,status,mpesa_receipt_number,phone_number,result_desc,needs_review,review_note,orders!inner(reference,quarter_id,organisations(name))";

export async function loadPayments(sb: SupabaseClient, quarterId: string, p: { status?: string; page?: number }): Promise<PaymentsData> {
  const page = Math.max(Math.floor(p.page ?? 1) || 1, 1);

  let q = sb.from("mpesa_transactions").select(COLS, { count: "exact" }).eq("orders.quarter_id", quarterId);
  if (p.status === "failed") q = q.in("status", ["failed", "timeout"]);
  else if (p.status === "success" || p.status === "pending") q = q.eq("status", p.status);

  const from = (page - 1) * PAGE_SIZE;
  const [list, review, sums] = await Promise.all([
    q.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1),
    // stuck payments matter whatever quarter is selected
    sb.from("mpesa_transactions").select(COLS).eq("needs_review", true).eq("status", "pending").order("created_at"),
    sb.from("mpesa_transactions").select("amount_kes,status,orders!inner(quarter_id)").eq("orders.quarter_id", quarterId),
  ]);
  if (list.error) throw new Error(list.error.message);

  const all = (sums.data ?? []) as unknown as { amount_kes: number; status: string }[];
  const ok = all.filter((t) => t.status === "success");
  return {
    rows: (list.data ?? []) as unknown as PaymentRow[], count: list.count ?? 0, page, pageSize: PAGE_SIZE,
    review: (review.data ?? []) as unknown as PaymentRow[],
    summary: {
      successKes: ok.reduce((s, t) => s + Number(t.amount_kes), 0), successCount: ok.length,
      failedCount: all.filter((t) => t.status === "failed" || t.status === "timeout").length,
      reviewCount: (review.data ?? []).length,
    },
  };
}