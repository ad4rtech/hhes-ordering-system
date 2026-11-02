import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { friendlyReason } from "@/lib/mpesa/messages";
import { notifyPaid, notifyPaymentFailed } from "@/lib/email/orderEmails";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("confirm"),
    receipt: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{10}$/, "M-Pesa receipts are 10 letters/numbers"),
    amount: z.number().int().min(1).max(10_000_000).optional(), // defaults to the amount requested
  }),
  z.object({ action: z.literal("mark_failed"), note: z.string().trim().max(300).optional() }),
]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;

  const { data: tx } = await g.supabase.from("mpesa_transactions")
    .select("id,checkout_request_id,status").eq("id", id).maybeSingle();
  if (!tx) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (tx.status !== "pending")
    return NextResponse.json({ error: `This payment is already ${tx.status}` }, { status: 409 });

  const confirm = body.action === "confirm";
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("apply_mpesa_result", {
    p_checkout_id: tx.checkout_request_id,
    p_result_code: confirm ? 0 : 1037,
    p_result_desc: confirm ? "Confirmed by admin from the Paybill statement"
                           : (body.action === "mark_failed" && body.note) || "No payment found on the Paybill statement",
    p_receipt: confirm ? body.receipt : null,
    p_amount: confirm ? (body.amount ?? null) : null,
    p_tx_date: confirm ? new Date().toISOString() : null,
    p_payload: { source: "admin_manual", resolved_by: g.user.id },
  });
  if (error) {
    const dup = error.code === "23505";
    return NextResponse.json({ error: dup ? "That receipt number is already recorded on another payment" : error.message }, { status: 409 });
  }

  await admin.from("mpesa_transactions").update({ needs_review: false, review_note: null }).eq("id", id);

  const r = data as { outcome: string; order_id?: string; amount?: number; receipt?: string; transaction_date?: string; amount_due?: number; result_code?: number };
  if ((r.outcome === "paid" || r.outcome === "partial") && r.order_id)
    await notifyPaid(r.order_id, r.receipt ?? null, Number(r.amount), r.transaction_date ?? null, Number(r.amount_due ?? 0));
  else if (r.outcome === "failed" && r.order_id)
    await notifyPaymentFailed(r.order_id, friendlyReason(r.result_code, undefined));

  return NextResponse.json({ ok: true, outcome: r.outcome });
}