import { sendBatch, sendEmail, type Message } from "./send";
import { createAdminClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/utils/format";
import DeadlineReminder from "@/emails/DeadlineReminder";
import { onRemindersSent } from "@/lib/notifications/events"; // adjust to where onRemindersSent lives
import { notifyUsers } from "@/lib/notifications/rep"; // adjust to where notifyUsers lives

const nairobiToday = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export async function runDeadlineReminders(dry: boolean) {
  const sb = createAdminClient();
  const { data: q } = await sb.from("quarters").select("*").eq("status", "published").maybeSingle();
  if (!q) return { quarter: null, candidates: [], sent: 0, note: "No published quarter" };

  const [orgs, orders, overrides] = await Promise.all([
    sb.from("organisations").select("id,user_id,name,contact_name,contact_email").eq("status", "approved"),
    sb.from("orders").select("id,organisation_id,payment_status,total_amount_kes,amount_paid_kes")
      .eq("quarter_id", q.id).neq("status", "cancelled"),
    sb.from("deadline_overrides").select("organisation_id,new_deadline").eq("quarter_id", q.id),
  ]);

  const today = nairobiToday();
  const candidates: {
    org: { id: string; user_id: string | null; name: string; contact_name: string; contact_email: string };
    deadline: string; daysLeft: number; orderId: string | null; amountDue: number;
  }[] = [];

  for (const org of orgs.data ?? []) {
    const order = (orders.data ?? []).find((o) => o.organisation_id === org.id);
    if (order?.payment_status === "paid") continue;          // ordered AND paid: no reminder

    const ov = (overrides.data ?? []).filter((o) => o.organisation_id === org.id).map((o) => o.new_deadline).sort().pop();
    const deadline = ov && ov > q.deadline_date ? ov : q.deadline_date;
    const daysLeft = daysBetween(today, deadline);
    if (daysLeft < 0 || daysLeft > 3) continue;

    candidates.push({
      org, deadline, daysLeft, orderId: order?.id ?? null,
      amountDue: order ? Number(order.total_amount_kes) - Number(order.amount_paid_kes) : 0,
    });
  }

  const summary = candidates.map((c) => ({
    organisation: c.org.name, deadline: c.deadline, days_left: c.daysLeft,
    reason: c.orderId ? "unpaid_order" : "no_order",
  }));
  if (dry) return { quarter: q.name, candidates: summary, sent: 0, dry: true };

  // Claim each (org, deadline) once: a retried cron run can't double-send
  const messages: Message[] = [];
  const claimedUsers: string[] = [];
  const app = process.env.NEXT_PUBLIC_APP_URL;
  for (const c of candidates) {
    const { error } = await sb.from("notification_log").insert({
      organisation_id: c.org.id, quarter_id: q.id, dedupe_key: `deadline_reminder:${c.deadline}`,
    });
    if (error) continue; // already sent (unique violation)
    if (c.org.user_id) claimedUsers.push(c.org.user_id);
    messages.push({
      to: c.org.contact_email,
      subject: `${q.name} orders close ${c.daysLeft === 0 ? "today" : `in ${c.daysLeft} day${c.daysLeft === 1 ? "" : "s"}`}`,
      react: <DeadlineReminder contactName={c.org.contact_name} quarterName={q.name} deadline={fmtDate(c.deadline)}
               daysLeft={c.daysLeft} hasOrder={!!c.orderId} amountDue={c.amountDue}
               actionUrl={c.orderId ? `${app}/rep/order/${c.orderId}/pay` : `${app}/rep/order/place`} />,
    });
  }
  await sendBatch(messages);
  await notifyUsers(claimedUsers, {
    type: "deadline_reminder", dedupeKey: `deadline_reminder:${q.id}:${today}`,
    title: `${q.name} orders are closing`, body: `Place and pay for your order before the deadline.`,
    link: "/rep/dashboard", actionLabel: "Open dashboard",
  });
  await onRemindersSent(q, messages.length);
  return { quarter: q.name, candidates: summary, sent: messages.length };
}

export type ReminderResult = { ok: true } | { ok: false; status: number; error: string };

// Admin-triggered reminder for one organisation (at most one per organisation per day)
export async function sendManualReminder(orgId: string, quarterId: string): Promise<ReminderResult> {
  const sb = createAdminClient();
  const [{ data: q }, { data: org }] = await Promise.all([
    sb.from("quarters").select("*").eq("id", quarterId).maybeSingle(),
    sb.from("organisations").select("id,user_id,name,contact_name,contact_email,status").eq("id", orgId).maybeSingle(),
  ]);
  if (!q || q.status !== "published") return { ok: false, status: 409, error: "Reminders can only be sent for the open quarter" };
  if (!org || org.status !== "approved") return { ok: false, status: 409, error: "Organisation is not approved" };

  const [{ data: order }, { data: ov }] = await Promise.all([
    sb.from("orders").select("id,payment_status,total_amount_kes,amount_paid_kes")
      .eq("organisation_id", orgId).eq("quarter_id", quarterId).neq("status", "cancelled").maybeSingle(),
    sb.from("deadline_overrides").select("new_deadline")
      .eq("organisation_id", orgId).eq("quarter_id", quarterId).order("new_deadline", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (order?.payment_status === "paid") return { ok: false, status: 409, error: `${org.name} has already ordered and paid` };

  const deadline = ov && ov.new_deadline > q.deadline_date ? ov.new_deadline : q.deadline_date;
  const today = nairobiToday();
  const daysLeft = daysBetween(today, deadline);
  if (daysLeft < 0) return { ok: false, status: 409, error: `The deadline for ${org.name} passed on ${fmtDate(deadline)}` };

  const { error: dup } = await sb.from("notification_log").insert({
    organisation_id: orgId, quarter_id: quarterId, dedupe_key: `manual_reminder:${today}`,
  });
  if (dup) return { ok: false, status: 409, error: "A reminder was already sent to this organisation today" };

  const app = process.env.NEXT_PUBLIC_APP_URL;
  await sendEmail({
    to: org.contact_email,
    subject: `${q.name} orders close ${daysLeft === 0 ? "today" : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}`,
    react: <DeadlineReminder contactName={org.contact_name} quarterName={q.name} deadline={fmtDate(deadline)}
             daysLeft={daysLeft} hasOrder={!!order} amountDue={order ? Number(order.total_amount_kes) - Number(order.amount_paid_kes) : 0}
             actionUrl={order ? `${app}/rep/order/${order.id}/pay` : `${app}/rep/order/place`} />,
  });
  if (org.user_id) {
    await notifyUsers([org.user_id], {
      type: "deadline_reminder", dedupeKey: `deadline_reminder:${quarterId}:${today}`,
      title: `${q.name} orders are closing`, body: `Place and pay for your order before the deadline.`,
      link: "/rep/dashboard", actionLabel: "Open dashboard",
    });
  }
  return { ok: true };
}

export type BulkResult = { ok: true; sent: number; skipped: number } | { ok: false; status: number; error: string };

// Reminds every approved organisation without an active order (one email per organisation per day)
export async function sendBulkReminders(quarterId: string): Promise<BulkResult> {
  const sb = createAdminClient();
  const { data: q } = await sb.from("quarters").select("*").eq("id", quarterId).maybeSingle();
  if (!q || q.status !== "published") return { ok: false, status: 409, error: "Reminders can only be sent for the open quarter" };

  const [orgs, orders, overrides] = await Promise.all([
    sb.from("organisations").select("id,user_id,name,contact_name,contact_email").eq("status", "approved"),
    sb.from("orders").select("organisation_id").eq("quarter_id", quarterId).neq("status", "cancelled"),
    sb.from("deadline_overrides").select("organisation_id,new_deadline").eq("quarter_id", quarterId),
  ]);
  const ordered = new Set((orders.data ?? []).map((o) => o.organisation_id));
  const today = nairobiToday();

  let skipped = 0;
  const candidates: { org: { id: string; user_id: string | null; contact_name: string; contact_email: string }; daysLeft: number; deadline: string }[] = [];
  for (const org of orgs.data ?? []) {
    if (ordered.has(org.id)) continue;
    const ov = (overrides.data ?? []).filter((o) => o.organisation_id === org.id).map((o) => o.new_deadline).sort().pop();
    const deadline = ov && ov > q.deadline_date ? ov : q.deadline_date;
    const daysLeft = daysBetween(today, deadline);
    if (daysLeft < 0) { skipped++; continue; }
    candidates.push({ org, daysLeft, deadline });
  }
  if (!candidates.length) return { ok: true, sent: 0, skipped };

  // One bulk insert: rows that already exist (reminded today) are ignored and only the new ones come back
  const { data: claimed } = await sb.from("notification_log")
    .upsert(candidates.map((c) => ({ organisation_id: c.org.id, quarter_id: quarterId, dedupe_key: `manual_reminder:${today}` })),
      { onConflict: "organisation_id,quarter_id,dedupe_key", ignoreDuplicates: true })
    .select("organisation_id");
  const fresh = new Set((claimed ?? []).map((r) => r.organisation_id));
  skipped += candidates.length - fresh.size;

  const app = process.env.NEXT_PUBLIC_APP_URL;
  const sending = candidates.filter((c) => fresh.has(c.org.id));
  const messages: Message[] = sending.map((c) => ({
    to: c.org.contact_email,
    subject: `${q.name} orders close ${c.daysLeft === 0 ? "today" : `in ${c.daysLeft} day${c.daysLeft === 1 ? "" : "s"}`}`,
    react: <DeadlineReminder contactName={c.org.contact_name} quarterName={q.name} deadline={fmtDate(c.deadline)}
             daysLeft={c.daysLeft} hasOrder={false} amountDue={0} actionUrl={`${app}/rep/order/place`} />,
  }));
  await sendBatch(messages);
  const sentUserIds = sending.map((c) => c.org.user_id).filter((id): id is string => !!id);
  await notifyUsers(sentUserIds, {
    type: "deadline_reminder", dedupeKey: `deadline_reminder:${quarterId}:${today}`,
    title: `${q.name} orders are closing`, body: `Place and pay for your order before the deadline.`,
    link: "/rep/dashboard", actionLabel: "Open dashboard",
  });
  return { ok: true, sent: messages.length, skipped };
}