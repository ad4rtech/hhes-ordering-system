import type { SupabaseClient } from "@supabase/supabase-js";
import { SLUGS } from "@/lib/validations/order.schema";
import { effectiveDeadline } from "@/lib/utils/deadline";
import type { Report, Row } from "./csv";
import { stockStatus } from "./stock";

export type Quarter = { id: string; name: string; open_date: string; deadline_date: string; status: string };

const LABELS: Record<string, string> = {
  adults_lesson: "Adults Lesson", adults_dq: "Adults Lesson Double Quarter",
  kindergarten: "Kindergarten", primary: "Primary", cornerstone: "Cornerstone", realtime: "Realtime",
};
const num = (v: unknown) => Number(v ?? 0);
const mask = (p: string) => (p.length > 7 ? `${p.slice(0, 4)}***${p.slice(-3)}` : "***");

// Published quarter by default; otherwise the most recent one
export async function resolveQuarter(sb: SupabaseClient, quarterId?: string | null): Promise<Quarter | null> {
  if (quarterId) {
    const { data } = await sb.from("quarters").select("*").eq("id", quarterId).maybeSingle();
    return data as Quarter | null;
  }
  const { data: pub } = await sb.from("quarters").select("*").eq("status", "published").maybeSingle();
  if (pub) return pub as Quarter;
  const { data: latest } = await sb.from("quarters").select("*")
    .order("open_date", { ascending: false }).limit(1).maybeSingle();
  return latest as Quarter | null;
}

// ---------- demand vs stock, with revenue per category ----------
type Item = { category_slug: string; quantity: number; unit_price_kes: number };

export async function buildDemand(sb: SupabaseClient, q: Quarter): Promise<Report> {
  const [cat, ord] = await Promise.all([
    sb.from("catalogue_items").select("category_slug,price_kes,stock_quantity").eq("quarter_id", q.id),
    sb.from("orders").select("payment_status,order_items(category_slug,quantity,unit_price_kes)")
      .eq("quarter_id", q.id).neq("status", "cancelled"),
  ]);
  const catalogue = (cat.data ?? []) as { category_slug: string; price_kes: number; stock_quantity: number }[];
  const orders = (ord.data ?? []) as { payment_status: string; order_items: Item[] }[];

  const rows: Row[] = SLUGS.map((slug) => {
    const ci = catalogue.find((c) => c.category_slug === slug);
    let ordered = 0, valueOrdered = 0, paidValue = 0;
    for (const o of orders)
      for (const it of o.order_items)
        if (it.category_slug === slug) {
          const v = it.quantity * num(it.unit_price_kes);
          ordered += it.quantity; valueOrdered += v;
          if (o.payment_status === "paid") paidValue += v;
        }
    const stock = num(ci?.stock_quantity);
    const remaining = stock - ordered;
    const level = stockStatus(stock, ordered);
    return {
      category: LABELS[slug], price_kes: num(ci?.price_kes), stock, ordered, remaining, level,
      value_ordered_kes: valueOrdered, revenue_paid_kes: paidValue,
    };
  });

  const sum = (k: string) => rows.reduce((s, r) => s + num(r[k]), 0);
  return {
    columns: ["category", "price_kes", "stock", "ordered", "remaining", "level", "value_ordered_kes", "revenue_paid_kes"],
    rows,
    summary: { total_ordered: sum("ordered"), total_value_ordered_kes: sum("value_ordered_kes"), total_revenue_paid_kes: sum("revenue_paid_kes") },
  };
}

// ---------- approved orgs with no order, or an unpaid one ----------
export async function buildNotOrdered(sb: SupabaseClient, q: Quarter, sp?: URLSearchParams): Promise<Report> {
  const [orgs, ord] = await Promise.all([
    sb.from("organisations").select("id,name,type,contact_name,contact_email").eq("status", "approved").order("name"),
    sb.from("orders").select("organisation_id,reference,payment_status,total_amount_kes,amount_paid_kes")
      .eq("quarter_id", q.id).neq("status", "cancelled"),
  ]);
  const byOrg = new Map(
    ((ord.data ?? []) as { organisation_id: string; reference: string; payment_status: string; total_amount_kes: number; amount_paid_kes: number }[])
      .map((o) => [o.organisation_id, o]),
  );
  const type = sp?.get("type");
  const rows: Row[] = [];
  for (const o of (orgs.data ?? []) as { id: string; name: string; type: string; contact_name: string; contact_email: string }[]) {
    if (type && o.type !== type) continue;
    const order = byOrg.get(o.id);
    if (order?.payment_status === "paid") continue;
    rows.push({
      organisation: o.name, type: o.type, contact: o.contact_name, email: o.contact_email,
      reason: !order ? "no_order" : order.payment_status === "failed" ? "payment_failed" : "awaiting_payment",
      order_reference: order?.reference ?? null,
      amount_due_kes: order ? num(order.total_amount_kes) - num(order.amount_paid_kes) : null,
    });
  }
  return {
    columns: ["organisation", "type", "contact", "email", "reason", "order_reference", "amount_due_kes"],
    rows,
    summary: { no_order: rows.filter((r) => r.reason === "no_order").length, unpaid: rows.filter((r) => r.reason !== "no_order").length },
  };
}

// ---------- M-Pesa reconciliation (match against the Paybill statement) ----------
export async function buildPayments(sb: SupabaseClient, q: Quarter, sp: URLSearchParams): Promise<Report> {
  let query = sb.from("mpesa_transactions")
    .select("*, orders!inner(reference,quarter_id,organisations(name,type))")
    .eq("orders.quarter_id", q.id)
    .order("created_at", { ascending: false });

  const status = sp.get("status"), from = sp.get("from"), to = sp.get("to");
  if (status) query = query.eq("status", status);
  if (from) query = query.gte("created_at", `${from}T00:00:00+03:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59+03:00`);

  const { data } = await query;
  type Tx = {
    status: string; mpesa_receipt_number: string | null; amount_kes: number; phone_number: string;
    transaction_date: string | null; created_at: string; result_desc: string | null; checkout_request_id: string;
    needs_review: boolean;
    orders: { reference: string; organisations: { name: string; type: string } };
  };
  const txs = (data ?? []) as unknown as Tx[];

  const rows: Row[] = txs.map((t) => ({
    organisation: t.orders.organisations.name,
    order_reference: t.orders.reference,
    mpesa_receipt: t.mpesa_receipt_number,
    amount_kes: num(t.amount_kes),
    phone: mask(t.phone_number),
    status: t.status,
    transaction_date: t.transaction_date,
    initiated_at: t.created_at,
    result: t.result_desc,
    checkout_request_id: t.checkout_request_id,
    needs_review: t.needs_review,
  }));
  return {
    columns: ["organisation", "order_reference", "mpesa_receipt", "amount_kes", "phone", "status", "transaction_date", "initiated_at", "result", "checkout_request_id", "needs_review"],
    rows,
    summary: {
      successful_total_kes: txs.filter((t) => t.status === "success").reduce((s, t) => s + num(t.amount_kes), 0),
      successful_count: txs.filter((t) => t.status === "success").length,
      failed_count: txs.filter((t) => t.status === "failed" || t.status === "timeout").length,
    },
  };
}

// ---------- order summary export ----------
export async function buildOrdersExport(sb: SupabaseClient, q: Quarter): Promise<Report> {
  const { data } = await sb.from("orders")
    .select("reference,status,payment_status,total_amount_kes,amount_paid_kes,refund_due,submitted_at,collected_at,organisations(name,type),order_items(category_slug,quantity)")
    .eq("quarter_id", q.id).order("submitted_at");
  type O = {
    reference: string; status: string; payment_status: string; total_amount_kes: number; amount_paid_kes: number;
    refund_due: boolean; submitted_at: string | null; collected_at: string | null;
    organisations: { name: string; type: string }; order_items: { category_slug: string; quantity: number }[];
  };
  const rows: Row[] = ((data ?? []) as unknown as O[]).map((o) => {
    const base: Row = {
      order_reference: o.reference, organisation: o.organisations.name, type: o.organisations.type,
      status: o.status, payment_status: o.payment_status,
    };
    for (const s of SLUGS) base[LABELS[s]] = o.order_items.find((i) => i.category_slug === s)?.quantity ?? 0;
    return {
      ...base, total_kes: num(o.total_amount_kes), paid_kes: num(o.amount_paid_kes),
      refund_due: o.refund_due, submitted_at: o.submitted_at, collected_at: o.collected_at,
    };
  });
  return {
    columns: ["order_reference", "organisation", "type", "status", "payment_status", ...SLUGS.map((s) => LABELS[s]), "total_kes", "paid_kes", "refund_due", "submitted_at", "collected_at"],
    rows,
  };
}

// ---------- override audit log ----------
export async function buildOverrides(sb: SupabaseClient, quarterId?: string | null): Promise<Report> {
  let query = sb.from("deadline_overrides")
    .select("*, organisations(name), quarters(name), granted_by_profile:profiles!granted_by(full_name)")
    .order("granted_at", { ascending: false });
  if (quarterId) query = query.eq("quarter_id", quarterId);
  const { data } = await query;
  type R = {
    original_deadline: string; new_deadline: string; reason: string; granted_at: string;
    organisations: { name: string }; quarters: { name: string }; granted_by_profile: { full_name: string | null } | null;
  };
  return {
    columns: ["organisation", "quarter", "original_deadline", "new_deadline", "reason", "granted_by", "granted_at"],
    rows: ((data ?? []) as unknown as R[]).map((r) => ({
      organisation: r.organisations.name, quarter: r.quarters.name,
      original_deadline: r.original_deadline, new_deadline: r.new_deadline, reason: r.reason,
      granted_by: r.granted_by_profile?.full_name ?? null, granted_at: r.granted_at,
    })),
  };
}

// ---------- admin dashboard: metric cards + demand table ----------
export async function buildDashboard(sb: SupabaseClient, q: Quarter) {
  const [{ data }, demand, notOrdered, review] = await Promise.all([
    sb.from("orders").select("status,payment_status,amount_paid_kes,refund_due,refund_amount_kes").eq("quarter_id", q.id),
    buildDemand(sb, q),
    buildNotOrdered(sb, q),
    sb.from("mpesa_transactions").select("id", { count: "exact", head: true }).eq("needs_review", true).eq("status", "pending"),
  ]);
  const orders = (data ?? []) as { status: string; payment_status: string; amount_paid_kes: number; refund_due: boolean; refund_amount_kes: number }[];
  const active = orders.filter((o) => o.status !== "cancelled");
  const count = (s: string) => orders.filter((o) => o.status === s).length;

  const deadlineAt = effectiveDeadline(q.deadline_date);
  const msLeft = deadlineAt.getTime() - Date.now();

  return {
    quarter: q,
    cards: {
      total_orders: active.length,
      revenue_collected_kes: active.reduce((s, o) => s + num(o.amount_paid_kes) - num(o.refund_amount_kes), 0),
      refunds_pending_kes: orders.filter((o) => o.refund_due).reduce((s, o) => s + num(o.refund_amount_kes), 0),
      pending_pickup: count("paid") + count("ready_for_pickup"),
      orgs_not_yet_ordered_or_paid: notOrdered.rows.length,
      payments_needing_review: review.count ?? 0,
      deadline: {
        at: deadlineAt.toISOString(),
        passed: msLeft <= 0,
        days_left: Math.max(Math.ceil(msLeft / 86_400_000), 0),
        ms_left: Math.max(msLeft, 0),
      },
    },
    status_counts: {
      awaiting_payment: count("awaiting_payment"), paid: count("paid"),
      ready_for_pickup: count("ready_for_pickup"), collected: count("collected"), cancelled: count("cancelled"),
    },
    demand: demand.rows,
  };
}

// ---------- org rep: own history, category breakdown, quarter-on-quarter ----------
export async function buildMyReport(sb: SupabaseClient): Promise<{ history: Report; breakdown: Row[]; qoq: Row[] }> {
  // RLS limits this to the caller's own organisation
  const { data } = await sb.from("orders")
    .select("reference,status,payment_status,total_amount_kes,amount_paid_kes,submitted_at,quarters(name,open_date),order_items(category_slug,quantity)")
    .order("submitted_at", { ascending: false });
  type O = {
    reference: string; status: string; payment_status: string; total_amount_kes: number; amount_paid_kes: number;
    submitted_at: string | null; quarters: { name: string; open_date: string }; order_items: { category_slug: string; quantity: number }[];
  };
  const orders = (data ?? []) as unknown as O[];

  const rows: Row[] = orders.map((o) => {
    const r: Row = { quarter: o.quarters.name, order_reference: o.reference, status: o.status, payment_status: o.payment_status };
    for (const s of SLUGS) r[LABELS[s]] = o.order_items.find((i) => i.category_slug === s)?.quantity ?? 0;
    return { ...r, total_kes: num(o.total_amount_kes), paid_kes: num(o.amount_paid_kes), submitted_at: o.submitted_at };
  });

  const active = orders.filter((o) => o.status !== "cancelled");
  const breakdown: Row[] = SLUGS.map((s) => ({
    category: LABELS[s],
    total_books: active.reduce((sum, o) => sum + (o.order_items.find((i) => i.category_slug === s)?.quantity ?? 0), 0),
  }));

  const chrono = [...active].sort((a, b) => a.quarters.open_date.localeCompare(b.quarters.open_date));
  const qoq: Row[] = chrono.map((o, i) => {
    const books = o.order_items.reduce((s, it) => s + it.quantity, 0);
    const prev = chrono[i - 1];
    const prevBooks = prev ? prev.order_items.reduce((s, it) => s + it.quantity, 0) : null;
    return {
      quarter: o.quarters.name, total_books: books, total_kes: num(o.total_amount_kes),
      books_change: prevBooks === null ? null : books - prevBooks,
      kes_change: prev ? num(o.total_amount_kes) - num(prev.total_amount_kes) : null,
    };
  });

  return {
    history: { columns: ["quarter", "order_reference", "status", "payment_status", ...SLUGS.map((s) => LABELS[s]), "total_kes", "paid_kes", "submitted_at"], rows },
    breakdown, qoq,
  };
}