import { sendEmail } from "./send";
import { createAdminClient } from "@/lib/supabase/server";
import { fmtDateTime, kes } from "@/lib/utils/format";
import { notifyOrg } from "@/lib/notifications/rep";
import OrderSubmitted from "@/emails/OrderSubmitted";
import PaymentConfirmed from "@/emails/PaymentConfirmed";
import PaymentFailed from "@/emails/PaymentFailed";
import OrderAmended from "@/emails/OrderAmended";
import OrderCancelled from "@/emails/OrderCancelled";
import OrderReadyForPickup from "@/emails/OrderReadyForPickup";
import OrderCollected from "@/emails/OrderCollected";

const LABELS: Record<string, string> = {
  adults_lesson: "Adults Lesson", adults_dq: "Adults Lesson Double Quarter",
  kindergarten: "Kindergarten", primary: "Primary", cornerstone: "Cornerstone", realtime: "Realtime",
};
const app = () => process.env.NEXT_PUBLIC_APP_URL ?? "";

type Row = {
  id: string; organisation_id: string; reference: string; total_amount_kes: number; amount_paid_kes: number;
  organisations: { name: string; contact_name: string; contact_email: string };
  quarters: { name: string };
  order_items: { category_slug: string; quantity: number; unit_price_kes: number }[];
};

export async function loadOrder(orderId: string) {
  const { data } = await createAdminClient().from("orders")
    .select("organisation_id,id,reference,total_amount_kes,amount_paid_kes,organisations(name,contact_name,contact_email),quarters(name),order_items(category_slug,quantity,unit_price_kes)")
    .eq("id", orderId).single();
  return data as unknown as Row | null;
}

const base = (o: Row) => ({
  contactName: o.organisations.contact_name,
  orgName: o.organisations.name,
  quarterName: o.quarters.name,
  reference: o.reference,
  total: Number(o.total_amount_kes),
  lines: o.order_items.filter((i) => i.quantity > 0).map((i) => ({
    label: LABELS[i.category_slug], quantity: i.quantity, unit: Number(i.unit_price_kes),
  })),
});
const to = (o: Row) => o.organisations.contact_email;
const payUrl = (o: Row) => `${app()}/rep/order/${o.id}/pay`;

export async function notifySubmitted(orderId: string) {
  const o = await loadOrder(orderId); if (!o) return;
  await sendEmail({ to: to(o), subject: `Order received (${o.reference})`,
    react: <OrderSubmitted {...base(o)} payUrl={payUrl(o)} /> });
}

export async function notifyAmended(orderId: string, adj: string, amountDue: number, refund: number) {
  const o = await loadOrder(orderId); if (!o) return;
  await sendEmail({ to: to(o), subject: `Order updated (${o.reference})`,
    react: <OrderAmended {...base(o)} adjustment={adj} amountDue={amountDue} refundAmount={refund} payUrl={payUrl(o)} /> });
}

export async function notifyCancelled(orderId: string, refund: number) {
  const o = await loadOrder(orderId); if (!o) return;
  await sendEmail({ to: to(o), subject: `Order cancelled (${o.reference})`,
    react: <OrderCancelled {...base(o)} refundAmount={refund} /> });
}

export async function notifyReady(orderId: string) {
  const o = await loadOrder(orderId); if (!o) return;
  await sendEmail({ to: to(o), subject: `Your order is ready for pickup (${o.reference})`,
    react: <OrderReadyForPickup {...base(o)} address={process.env.HHES_ADDRESS ?? ""} hours={process.env.HHES_OFFICE_HOURS ?? ""} phone={process.env.HHES_PHONE ?? ""} /> });
  await notifyOrg(o.organisation_id, {
    type: "order_ready", dedupeKey: `order_ready:${orderId}`, title: "Your order is ready for pickup",
    body: `Order ${o.reference} is ready. Collect it at HHES during office hours.`, link: `/rep/orders?order=${orderId}`, actionLabel: "View order",
  });
}

export async function notifyCollected(orderId: string) {
  const o = await loadOrder(orderId); if (!o) return;
  const { data: tx } = await createAdminClient().from("mpesa_transactions")
    .select("mpesa_receipt_number").eq("order_id", orderId).eq("status", "success");
  const receipts = (tx ?? []).map((t: { mpesa_receipt_number: string }) => t.mpesa_receipt_number);
  await sendEmail({ to: to(o), subject: `Pickup confirmed (${o.reference})`,
    react: <OrderCollected {...base(o)} receipts={receipts} collectedAt={fmtDateTime(new Date())} /> });
  await notifyOrg(o.organisation_id, {
    type: "order_collected", dedupeKey: `order_collected:${orderId}`, title: "Pickup confirmed",
    body: `Order ${o.reference} has been collected. Thank you.`, link: `/rep/orders?order=${orderId}`, actionLabel: "View order",
  });
}

export async function notifyPaid(orderId: string, receipt: string | null, amount: number, when: string | null, amountDue = 0) {
  const o = await loadOrder(orderId); if (!o) return;
  await sendEmail({ to: to(o), subject: `Payment received (${o.reference})`,
    react: <PaymentConfirmed {...base(o)} receipt={receipt ?? "-"} amount={amount} paidAt={fmtDateTime(when ?? new Date())} amountDue={amountDue} payUrl={payUrl(o)} /> });
  await notifyOrg(o.organisation_id, {
    type: "payment_received", dedupeKey: `payment_received:${receipt ?? orderId}`,
    title: "Payment received", link: `/rep/orders?order=${orderId}`, actionLabel: "View order",
    body: `We received **${kes(amount)}** for order ${o.reference}.${receipt ? ` M-Pesa receipt **${receipt}**.` : ""}`,
  });
}

export async function notifyPaymentFailed(orderId: string, reason: string) {
  const o = await loadOrder(orderId); if (!o) return;
  await sendEmail({ to: to(o), subject: `M-Pesa payment not completed (${o.reference})`,
    react: <PaymentFailed {...base(o)} reason={reason} amountDue={Number(o.total_amount_kes) - Number(o.amount_paid_kes)} retryUrl={payUrl(o)} /> });
  await notifyOrg(o.organisation_id, {
    type: "payment_failed", title: "Payment not completed", link: `/rep/order/${orderId}/pay`, actionLabel: "Retry payment",
    body: `${reason} Your order is saved. Please retry before the deadline.`,
  });
}