import { api, toastFailure } from "@/lib/api";
import { notify } from "@/lib/notify";
import { kes } from "@/lib/utils/format";

export async function cancelOrder(id: string): Promise<boolean> {
  const res = await api<{ data: { refund_due: boolean; refund_amount: number } }>(`/api/orders/${id}/cancel`, { method: "POST", silent: true });
  if (res.ok) {
    const r = res.data.data;
    if (r.refund_due && r.refund_amount > 0) notify("rep.order.cancelled_refund", { amount: kes(r.refund_amount) });
    else notify("rep.order.cancelled");
    return true;
  }
  if (/cannot be cancelled/i.test(res.error)) notify("rep.order.cancel_failed", { reason: res.error });
  else toastFailure(res);
  return false;
}