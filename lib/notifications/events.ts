import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { stockStatus } from "@/lib/reports/stock";
import { CATEGORIES } from "@/lib/admin/catalogue";
import { loadOrder } from "@/lib/email/orderEmails";
import { fmtDate, kes } from "@/lib/utils/format";
import { notifyAdmins } from "./notify";

const clean = (s: string) => s.replace(/\*\*/g, ""); // names are user-typed; keep them from breaking the bold markers
const nairobiDate = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
const guard = async (fn: () => Promise<void>) => { try { await fn(); } catch (e) { console.error("[events]", e); } };

export const onRegistration = (orgName: string, userId: string) => guard(async () => {
  const { data: q } = await createAdminClient().from("quarters").select("name").eq("status", "published").maybeSingle();
  await notifyAdmins({
    type: "org_registration", pref: "org_registration", dedupeKey: `org_registration:${userId}`,
    title: "New Organisation Registration Pending",
    body: `**${clean(orgName)}** has submitted a registration request. Please review and approve the organisation to allow them to participate${q ? ` in the ${q.name} quarter` : ""}.`,
    link: "/admin/organisations", actionLabel: "Review Request",
  });
});

export const checkStockAlerts = (quarterId: string) => guard(async () => {
  const sb = createAdminClient();
  const [{ data: q }, { data: cat }, { data: orders }] = await Promise.all([
    sb.from("quarters").select("name,status").eq("id", quarterId).maybeSingle(),
    sb.from("catalogue_items").select("category_slug,stock_quantity").eq("quarter_id", quarterId),
    sb.from("orders").select("order_items(category_slug,quantity)").eq("quarter_id", quarterId).neq("status", "cancelled"),
  ]);
  if (!q || q.status !== "published") return;

  const stock = new Map((cat ?? []).map((c) => [c.category_slug, Number(c.stock_quantity)]));
  const ordered = new Map<string, number>();
  for (const o of (orders ?? []) as unknown as { order_items: { category_slug: string; quantity: number }[] }[])
    for (const i of o.order_items) ordered.set(i.category_slug, (ordered.get(i.category_slug) ?? 0) + i.quantity);

  for (const c of CATEGORIES) {
    const s = stock.get(c.slug) ?? 0, n = ordered.get(c.slug) ?? 0;
    if (s <= 0 || stockStatus(s, n) !== "critical") continue; // no stock set yet: nothing to alert on
    const left = s - n;
    await notifyAdmins({
      type: "critical_stock", pref: "critical_stock",
      dedupeKey: `critical_stock:${quarterId}:${c.slug}:${s}:${left <= 0 ? "out" : "low"}`, // again only after a restock
      title: `Critical Stock Alert: ${c.name}`,
      body: left > 0
        ? `Available stock for **${c.name}** has dropped below the critical threshold. Only **${left}** ${left === 1 ? "unit" : "units"} remaining vs ${n} ordered in ${q.name}. Please review procurement plans immediately.`
        : `Orders for **${c.name}** have reached the available stock: ${n} ordered vs ${s} in stock for ${q.name}. Please review procurement plans immediately.`,
      link: `/admin/catalogue?quarter=${quarterId}`, actionLabel: "View Catalogue",
    });
  }
});

export const onOrderPlaced = (orderId: string) => guard(async () => {
  const sb = createAdminClient();
  const { data } = await sb.from("orders")
    .select("quarter_id,organisations(name),quarters(name,deadline_date)").eq("id", orderId).single();
  const o = data as unknown as { quarter_id: string; organisations: { name: string }; quarters: { name: string; deadline_date: string } } | null;
  if (!o) return;

  await checkStockAlerts(o.quarter_id);

  // An order after the standard deadline can only exist because of an extension
  if (nairobiDate() > o.quarters.deadline_date) {
    const { data: ov } = await sb.from("deadline_overrides").select("new_deadline")
      .eq("quarter_id", o.quarter_id).order("new_deadline", { ascending: false }).limit(1).maybeSingle();
    await notifyAdmins({
      type: "override_used", pref: "deadline_overrides", dedupeKey: `override_used:${orderId}`,
      title: "Deadline Override Utilized",
      body: `**${clean(o.organisations.name)}** successfully submitted their ${o.quarters.name} order using a deadline extension${ov ? ` granted until ${fmtDate(ov.new_deadline)}` : ""}. The override audit log has been updated.`,
      link: "/admin/quarters#extensions", actionLabel: "View Audit Log",
    });
  }
});

export const onOrderAmended = (orderId: string, adjustment: string, refund: number) => guard(async () => {
  const { data: o } = await createAdminClient().from("orders").select("quarter_id").eq("id", orderId).single();
  if (o) await checkStockAlerts(o.quarter_id);
  if (adjustment !== "refund_due" || refund <= 0) return;
  const full = await loadOrder(orderId);
  if (!full) return;
  await notifyAdmins({
    type: "refund_due", pref: "refund_due", dedupeKey: `refund_due:${orderId}:${refund}`, title: "Refund Due",
    body: `**${clean(full.organisations.name)}** reduced a paid order (${full.reference}). **${kes(refund)}** needs to be refunded through the Safaricom portal, then marked as processed.`,
    link: `/admin/orders?status=all&order=${orderId}`, actionLabel: "View Order",
  });
});

export const onOrderCancelled = (orderId: string, refund: number) => guard(async () => {
  const o = await loadOrder(orderId);
  if (!o) return;
  const org = clean(o.organisations.name);
  const link = `/admin/orders?status=all&order=${orderId}`;
  await notifyAdmins({
    type: "order_cancelled", pref: "order_cancelled", dedupeKey: `order_cancelled:${orderId}`,
    title: "Order Cancelled by Organisation",
    body: `**${org}** has cancelled their submitted order (${o.reference}) for ${o.quarters.name}. This order will no longer be fulfilled.`,
    link, actionLabel: "View Order",
  });
  if (refund > 0)
    await notifyAdmins({
      type: "refund_due", pref: "refund_due", dedupeKey: `refund_due:${orderId}:${refund}`, title: "Refund Due",
      body: `**${org}** cancelled a paid order (${o.reference}). **${kes(refund)}** needs to be refunded through the Safaricom portal, then marked as processed.`,
      link, actionLabel: "View Order",
    });
});

export const onOverrideGranted = (overrideId: string) => guard(async () => {
  const { data } = await createAdminClient().from("deadline_overrides")
    .select("id,new_deadline,reason,granted_by,organisations(name),quarters(name),granted_by_profile:profiles!granted_by(full_name)")
    .eq("id", overrideId).single();
  const x = data as unknown as { new_deadline: string; reason: string; granted_by: string; organisations: { name: string }; quarters: { name: string }; granted_by_profile: { full_name: string | null } | null } | null;
  if (!x) return;
  await notifyAdmins({
    type: "override_granted", pref: "deadline_overrides", exceptUser: x.granted_by, dedupeKey: `override_granted:${overrideId}`,
    title: "Deadline Extension Granted",
    body: `**${clean(x.granted_by_profile?.full_name ?? "An admin")}** extended **${clean(x.organisations.name)}**'s deadline for ${x.quarters.name} to ${fmtDate(x.new_deadline)}. Reason: ${clean(x.reason)}`,
    link: "/admin/quarters#extensions", actionLabel: "View Audit Log",
  });
});

export const onRemindersSent = (q: { id: string; name: string }, sent: number) => guard(async () => {
  if (sent < 1) return;
  await notifyAdmins({
    type: "reminders_sent", dedupeKey: `reminders:${q.id}:${nairobiDate()}`, // in-app only
    title: "Automated Reminders Dispatched",
    body: `The system has automatically sent the deadline reminder email to the **${sent}** ${sent === 1 ? "organisation" : "organisations"} that have not yet ordered and paid for the active ${q.name} quarter.`,
    link: `/admin/reports?quarter=${q.id}`, actionLabel: "View Pending Orgs",
  });
});

export const onPaymentReview = (txId: string) => guard(async () => {
  const { data } = await createAdminClient().from("mpesa_transactions")
    .select("id,amount_kes,review_note,orders(reference,organisations(name))").eq("id", txId).single();
  const t = data as unknown as { amount_kes: number; review_note: string | null; orders: { reference: string; organisations: { name: string } } } | null;
  if (!t) return;
  await notifyAdmins({
    type: "payment_review", pref: "payment_review", dedupeKey: `payment_review:${txId}`,
    title: "M-Pesa Payment Needs Review",
    body: `A **${kes(t.amount_kes)}** payment for ${t.orders.reference} from **${clean(t.orders.organisations.name)}** couldn't be confirmed automatically. Check the Paybill statement, then confirm it or mark it failed.`,
    link: "/admin/orders?tab=payments", actionLabel: "Review Payments",
  });
});