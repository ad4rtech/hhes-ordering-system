import { api, toastFailure } from "@/lib/api";
import { notify } from "@/lib/notify";

export type OrderRef = { id: string; reference: string; org: string };

function fail(res: { status: number; error: string; fields?: Record<string, string[]> }, to?: string) {
  const m = res.error;
  if (/not been fully paid/i.test(m)) notify("admin.order.unpaid");
  else if (/Cannot move an order from/i.test(m)) notify("admin.order.bad_transition", { from: "its current status", to: to ?? "that status" });
  else if (/No refund is pending/i.test(m)) notify("admin.order.no_refund");
  else toastFailure(res);
}

export async function markOrder(o: OrderRef, status: "ready_for_pickup" | "collected"): Promise<boolean> {
  const res = await api(`/api/orders/${o.id}/status`, { method: "PATCH", json: { status }, silent: true });
  if (res.ok) { notify(status === "ready_for_pickup" ? "admin.order.ready" : "admin.order.collected", { org: o.org }); return true; }
  fail(res, status.replace(/_/g, " "));
  return false;
}

export async function processRefund(o: OrderRef): Promise<boolean> {
  const res = await api(`/api/orders/${o.id}/status`, { method: "PATCH", json: { action: "refund_processed" }, silent: true });
  if (res.ok) { notify("admin.order.refund_processed"); return true; }
  fail(res);
  return false;
}