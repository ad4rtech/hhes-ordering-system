import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { parseCallback } from "@/lib/mpesa/callback";
import { friendlyReason } from "@/lib/mpesa/messages";
import { notifyPaid, notifyPaymentFailed } from "@/lib/email/orderEmails";

const ACK = { ResultCode: 0, ResultDesc: "Accepted" };

function secretOk(given: string | null) {
  const expected = process.env.MPESA_CALLBACK_SECRET ?? "";
  if (!given || !expected) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  // Not behind login (Safaricom calls it), so it carries its own shared secret
  if (!secretOk(new URL(req.url).searchParams.get("secret")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = await req.json().catch(() => null);
  const cb = parseCallback(payload);
  if (!cb) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { data, error } = await createAdminClient().rpc("apply_mpesa_result", {
    p_checkout_id: cb.checkoutRequestId,
    p_result_code: cb.resultCode,
    p_result_desc: cb.resultDesc,
    p_receipt: cb.receipt,
    p_amount: cb.amount,
    p_tx_date: cb.transactionDate,
    p_payload: payload,
  });
  if (error) {
    console.error("[callback] apply failed:", error.message);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }

  const r = data as {
    outcome: string; order_id?: string; amount?: number; receipt?: string;
    transaction_date?: string; amount_due?: number; result_desc?: string;
    result_code?: number;
  };

  // 'duplicate' and 'unknown' send nothing (BR-11). Emails never block the acknowledgement.
  if ((r.outcome === "paid" || r.outcome === "partial") && r.order_id)
    await notifyPaid(r.order_id, r.receipt ?? null, Number(r.amount), r.transaction_date ?? null, Number(r.amount_due ?? 0));
  else if (r.outcome === "failed" && r.order_id)
    await notifyPaymentFailed(r.order_id, friendlyReason(r.result_code, r.result_desc));
  else if (r.outcome === "paid_after_cancel")
    console.warn("[callback] payment after cancellation flagged refund_due", r.order_id);

  return NextResponse.json(ACK);
}