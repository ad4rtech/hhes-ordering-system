import { api, toastFailure } from "@/lib/api";
import { notify } from "@/lib/notify";

type Body = { action: "confirm"; receipt: string; amount?: number } | { action: "mark_failed"; note?: string };

export async function resolvePayment(txId: string, org: string, body: Body): Promise<boolean> {
  const res = await api(`/api/payments/${txId}/resolve`, { method: "POST", json: body, silent: true });
  if (res.ok) {
    if (body.action === "confirm") notify("admin.payment.confirmed", { receipt: body.receipt.toUpperCase(), org });
    else notify("admin.payment.marked_failed", { org });
    return true;
  }
  if (res.fields?.receipt) notify("admin.payment.receipt_invalid");
  else if (/already recorded/i.test(res.error)) notify("admin.payment.receipt_duplicate");
  else if (/This payment is already/i.test(res.error)) notify("admin.payment.already_settled", { status: res.error.match(/already (\w+)/i)?.[1] ?? "settled" });
  else toastFailure(res);
  return false;
}