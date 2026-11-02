import "server-only";
import type { getRepContext } from "./context";
import type { GrowthPoint, Issue, ReportsData, Share, TableRow, TimelineEvent } from "./reportTypes";
import { CHIP_NAME } from "./names";
import { friendlyReason } from "@/lib/mpesa/messages";
import { kes } from "@/lib/utils/format";

type Ctx = NonNullable<Awaited<ReturnType<typeof getRepContext>>>;
type QRow = { id: string; name: string; open_date: string; deadline_date: string; status: "published" | "closed" };
type Raw = {
  id: string; reference: string; status: string; payment_status: string; total_amount_kes: number; amount_paid_kes: number;
  refund_due: boolean; refund_amount_kes: number; is_historical: boolean; submitted_at: string | null; created_at: string; quarter_id: string;
  quarters: { name: string; open_date: string } | null; order_items: { category_slug: string; quantity: number }[];
};

const ORDER_COLS = "id,reference,status,payment_status,total_amount_kes,amount_paid_kes,refund_due,refund_amount_kes,is_historical,submitted_at,created_at,quarter_id,quarters(name,open_date),order_items(category_slug,quantity)";
const SLUGS = ["adults_lesson", "adults_dq", "kindergarten", "primary", "cornerstone", "realtime"];
const LEGEND: Record<string, string> = {
  adults_lesson: "Adults", adults_dq: "Adults Double Q.", kindergarten: "Kindergarten", primary: "Primary", cornerstone: "Cornerstone", realtime: "Realtime",
};

const nairobiDate = (t: string) => new Date(Date.parse(t) + 3 * 3600_000).toISOString().slice(0, 10);
const units = (o: { order_items: { quantity: number }[] }) => o.order_items.reduce((s, i) => s + i.quantity, 0);
const n = (v: number) => v.toLocaleString("en-KE");

function shortQuarter(name: string) {
  const m = name.match(/^Q([1-4])\s*[-/ ]?\s*(\d{4})$/i);
  return m ? `Q${m[1]} '${m[2].slice(2)}` : name;
}

// Whole-number percentages that always add up to 100
function shares(counts: { slug: string; qty: number }[]): Share[] {
  const total = counts.reduce((s, c) => s + c.qty, 0);
  const rows = counts.map((c) => ({ ...c, exact: (c.qty / total) * 100, pct: Math.floor((c.qty / total) * 100) }));
  let left = 100 - rows.reduce((s, r) => s + r.pct, 0);
  [...rows].sort((a, b) => (b.exact - b.pct) - (a.exact - a.pct)).forEach((r) => { if (left > 0) { r.pct += 1; left--; } });
  return rows.sort((a, b) => b.qty - a.qty).map((r) => ({ slug: r.slug, name: LEGEND[r.slug] ?? r.slug, qty: r.qty, pct: r.pct }));
}

export async function loadRepReports(ctx: Ctx): Promise<ReportsData> {
  const { sb, org } = ctx;
  const [o, qs, am] = await Promise.all([
    sb.from("orders").select(ORDER_COLS).order("created_at", { ascending: false }).limit(300),
    sb.from("quarters").select("id,name,open_date,deadline_date,status").neq("status", "draft").order("open_date", { ascending: false }),
    sb.from("order_amendments").select("id,order_id,amended_at"),
  ]);

  // Newest quarter first. Row Level Security already limits all of this to this organisation.
  const orders = ((o.data ?? []) as unknown as Raw[]).sort((a, b) => (b.quarters?.open_date ?? "").localeCompare(a.quarters?.open_date ?? ""));
  const quarters = (qs.data ?? []) as QRow[];
  const amendments = (am.data ?? []) as { id: string; order_id: string; amended_at: string }[];

  // ── Order history table
  const rows: TableRow[] = orders.map((x) => ({
    id: x.id, quarterId: x.quarter_id, quarter: x.quarters?.name ?? "-", reference: x.reference, date: x.submitted_at ?? x.created_at,
    categories: x.order_items.filter((i) => i.quantity > 0).length, quantity: units(x),
    total: Number(x.total_amount_kes), paid: Number(x.amount_paid_kes), status: x.status, payment: x.payment_status, imported: x.is_historical,
  }));

  // ── Quarter-on-quarter growth: closed quarters, plus the open one once you've ordered in it
  const booked = new Map<string, number>();
  for (const x of orders) if (x.status !== "cancelled") booked.set(x.quarter_id, (booked.get(x.quarter_id) ?? 0) + units(x));
  const ordered = new Set(orders.map((x) => x.quarter_id));
  const growth: GrowthPoint[] = quarters
    .filter((q) => q.status === "closed" || ordered.has(q.id)).slice(0, 4).reverse()
    .map((q, i, all) => ({ label: shortQuarter(q.name), value: booked.get(q.id) ?? 0, current: i === all.length - 1 }));

  // ── Category breakdown of the most recent live order
  const latest = orders.find((x) => x.status !== "cancelled" && units(x) > 0) ?? null;
  const breakdown = latest ? {
    quarter: latest.quarters?.name ?? "latest", total: units(latest),
    shares: shares(SLUGS.map((slug) => ({ slug, qty: latest.order_items.find((i) => i.category_slug === slug)?.quantity ?? 0 })).filter((c) => c.qty > 0)),
  } : null;

  // ── Amendment frequency (orders placed in the system, not imported history)
  const live = orders.filter((x) => !x.is_historical);
  const liveQuarters = new Set(live.map((x) => x.quarter_id));
  const liveIds = new Set(live.map((x) => x.id));
  const changes = amendments.filter((a) => liveIds.has(a.order_id)).length;
  const average = liveQuarters.size ? Math.round((changes / liveQuarters.size) * 10) / 10 : null;

  // ── Compliance
  const approved = org.approved_at ? nairobiDate(org.approved_at) : null;
  const issues: Issue[] = [];
  let eligible = 0, compliant = 0;
  for (const q of quarters) {
    const here = orders.filter((x) => x.quarter_id === q.id);
    const active = here.filter((x) => x.status !== "cancelled");
    const closed = q.status === "closed";
    const found: Issue[] = [];

    for (const x of active) {
      const when = x.submitted_at ?? x.created_at;
      if (!x.is_historical && nairobiDate(when) > q.deadline_date)
        found.push({ id: `late-${x.id}`, quarter: q.name, label: "Late Submission (extension used)", at: when, tone: "warning" });
      if (closed && x.status === "awaiting_payment")
        found.push({ id: `unpaid-${x.id}`, quarter: q.name, label: "Order Not Paid Before Close", at: q.deadline_date, tone: "danger" });
      const lateChange = amendments.filter((a) => a.order_id === x.id && nairobiDate(a.amended_at) > q.deadline_date).map((a) => a.amended_at).sort().at(-1);
      if (lateChange) found.push({ id: `lateam-${x.id}`, quarter: q.name, label: "Late Amendment (extension used)", at: lateChange, tone: "warning" });
    }

    let counts = false;
    if (closed) {
      if (active.length > 0) counts = true;
      else if (here.length === 0 && approved && approved <= q.deadline_date) {
        counts = true; // approved, quarter came and went, no order at all
        found.push({ id: `missed-${q.id}`, quarter: q.name, label: "Missed Submission Deadline", at: q.deadline_date, tone: "danger" });
      }
    }
    if (counts) { eligible++; if (found.length === 0) compliant++; }
    issues.push(...found);
  }
  issues.sort((a, b) => b.at.localeCompare(a.at));

  // ── Audit trail for the most recent order
  let timeline: ReportsData["timeline"] = null;
  const focus = orders[0] ?? null;
  if (focus) {
    const events: TimelineEvent[] = [];
    if (focus.is_historical) {
      events.push({ id: "imported", kind: "imported", title: "Imported Record", at: focus.submitted_at ?? focus.created_at,
        body: "This order comes from HHES's earlier records, from before the online system. No further activity is recorded." });
    } else {
      const [h, a, t] = await Promise.all([
        sb.from("order_status_history").select("id,from_status,to_status,changed_at").eq("order_id", focus.id),
        sb.from("order_amendments").select("id,previous_data,new_data,payment_adjustment,amended_at").eq("order_id", focus.id),
        sb.from("mpesa_transactions").select("id,amount_kes,status,result_code,result_desc,mpesa_receipt_number,transaction_date,created_at").eq("order_id", focus.id),
      ]);
      type Am = { id: string; previous_data: { items: Record<string, number> }; new_data: { items: Record<string, number> }; payment_adjustment: string | null; amended_at: string };
      const hist = (h.data ?? []) as { id: string; from_status: string | null; to_status: string; changed_at: string }[];
      const ams = ((a.data ?? []) as unknown as Am[]).sort((x, y) => x.amended_at.localeCompare(y.amended_at));
      const tx = (t.data ?? []) as { id: string; amount_kes: number; status: string; result_code: number | null; result_desc: string | null; mpesa_receipt_number: string | null; transaction_date: string | null; created_at: string }[];
      const sum = (m: Record<string, number>) => Object.values(m).reduce((s, v) => s + v, 0);
      const initialUnits = ams[0] ? sum(ams[0].previous_data.items) : units(focus);
      const address = process.env.HHES_ADDRESS ?? "the HHES centre";
      const paidViaTx = tx.some((x) => x.status === "success");

      for (const x of hist) {
        if (x.from_status === null)
          events.push({ id: `h-${x.id}`, kind: "submitted", title: "Order Submitted", at: x.changed_at, body: `Initial order placed via the digital portal. Total volume: ${n(initialUnits)}. Order ID: ${focus.reference}.` });
        else if (x.to_status === "paid" && !paidViaTx)
          events.push({ id: `h-${x.id}`, kind: "paid", title: "Payment Received", at: x.changed_at, body: "Payment confirmed by HHES." });
        else if (x.to_status === "ready_for_pickup")
          events.push({ id: `h-${x.id}`, kind: "ready", title: "Ready for Pickup", at: x.changed_at, body: "Order packed, verified, and marked ready for collection by HHES." });
        else if (x.to_status === "collected")
          events.push({ id: `h-${x.id}`, kind: "collected", title: "Order Collected", at: x.changed_at, body: `Order collected at ${address}. Pickup confirmed by HHES.` });
        else if (x.to_status === "cancelled")
          events.push({ id: `h-${x.id}`, kind: "cancelled", title: "Order Cancelled", at: x.changed_at,
            body: `Order cancelled by your organisation.${focus.refund_due ? ` A refund of ${kes(focus.refund_amount_kes)} is pending with HHES finance.` : ""}` });
      }
      for (const x of ams) {
        const diff = SLUGS.map((s) => ({ s, d: (x.new_data.items[s] ?? 0) - (x.previous_data.items[s] ?? 0) })).filter((c) => c.d !== 0)
          .map((c) => `${CHIP_NAME[c.s] ?? c.s} (${c.d > 0 ? "+" : ""}${c.d})`).join(", ");
        const note = x.payment_adjustment === "top_up_required" ? " An extra payment was needed." : x.payment_adjustment === "refund_due" ? " A refund became due." : "";
        events.push({ id: `a-${x.id}`, kind: "amended", title: "Order Amended", at: x.amended_at, body: `Quantities adjusted: ${diff || "no change"}. Total volume updated to ${n(sum(x.new_data.items))}.${note}` });
      }
      for (const x of tx) {
        if (x.status === "success")
          events.push({ id: `t-${x.id}`, kind: "paid", title: "Payment Received", at: x.transaction_date ?? x.created_at,
            body: `M-Pesa payment of ${kes(x.amount_kes)} received.${x.mpesa_receipt_number ? ` Receipt ${x.mpesa_receipt_number}.` : ""}` });
        else if (x.status === "failed" || x.status === "timeout")
          events.push({ id: `t-${x.id}`, kind: "payment_failed", title: "Payment Attempt Failed", at: x.created_at,
            body: friendlyReason(x.result_code ?? undefined, x.result_desc ?? undefined) });
      }
    }
    events.sort((x, y) => y.at.localeCompare(x.at));
    timeline = { quarter: focus.quarters?.name ?? "latest", reference: focus.reference, events };
  }

  return {
    rows, growth, breakdown, amendments: { average, quarters: liveQuarters.size },
    compliance: { percent: eligible ? Math.round((compliant / eligible) * 100) : null, eligible, issues },
    timeline,
  };
}