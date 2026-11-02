import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { stkQuery } from "./daraja";
import { friendlyReason } from "./messages";
import { notifyPaymentFailed } from "@/lib/email/orderEmails";
import { onPaymentReview } from "@/lib/notifications/events"; // adjust to where onPaymentReview lives

const FLAG_AFTER_MS = 30 * 60_000; // still unresolved after 30 min: a human takes over
const COOLDOWN_MS = 20_000;        // never query the same payment twice within 20s

type Pending = { id: string; order_id: string; checkout_request_id: string; created_at: string };

export async function sweepTransactions(opts: { orderId?: string; minAgeMs: number; limit: number }) {
  const sb = createAdminClient();
  const result = { checked: 0, failed: 0, flagged: 0, still_pending: 0, errors: 0 };

  let q = sb.from("mpesa_transactions")
    .select("id,order_id,checkout_request_id,created_at")
    .eq("status", "pending").eq("needs_review", false)
    .lt("created_at", new Date(Date.now() - opts.minAgeMs).toISOString())
    .order("created_at").limit(opts.limit);
  if (opts.orderId) q = q.eq("order_id", opts.orderId);
  const list = ((await q).data ?? []) as Pending[];

  const flag = async (id: string, note: string) => {
    await sb.from("mpesa_transactions").update({ needs_review: true, review_note: note }).eq("id", id).eq("status", "pending");
    await onPaymentReview(id);
  };

  const handle = async (tx: Pending) => {
    // Claim it: skip if another request just checked this payment
    const cutoff = new Date(Date.now() - COOLDOWN_MS).toISOString();
    const { data: claimed } = await sb.from("mpesa_transactions")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("id", tx.id).eq("status", "pending")
      .or(`last_checked_at.is.null,last_checked_at.lt.${cutoff}`)
      .select("id");
    if (!claimed?.length) return;

    result.checked++;
    const age = Date.now() - new Date(tx.created_at).getTime();
    try {
      const r = await stkQuery(tx.checkout_request_id);

      if (!r.done) {
        if (age > FLAG_AFTER_MS) {
          await flag(tx.id, "Safaricom still reports this payment as processing after 30 minutes.");
          result.flagged++;
        } else result.still_pending++;
        return;
      }

      if (r.resultCode === 0) {
        await flag(tx.id, "Safaricom says this payment succeeded but no callback arrived. Find the receipt on the Paybill statement and confirm it.");
        result.flagged++;
        return;
      }

      const { data, error } = await sb.rpc("apply_mpesa_result", {
        p_checkout_id: tx.checkout_request_id, p_result_code: r.resultCode, p_result_desc: r.resultDesc,
        p_receipt: null, p_amount: null, p_tx_date: null,
        p_payload: { source: "stk_query", result_code: r.resultCode, result_desc: r.resultDesc },
      });
      if (error) throw new Error(error.message);

      const out = data as { outcome: string; order_id?: string; result_code?: number; result_desc?: string };
      if (out.outcome === "failed" && out.order_id) {
        result.failed++;
        await notifyPaymentFailed(out.order_id, friendlyReason(out.result_code ?? r.resultCode, out.result_desc ?? r.resultDesc));
      }
    } catch (e) {
      result.errors++;
      console.error("[sweep]", tx.checkout_request_id, e);
    }
  };

  for (let i = 0; i < list.length; i += 5) await Promise.all(list.slice(i, i + 5).map(handle));
  return result;
}