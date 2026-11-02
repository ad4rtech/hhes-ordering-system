import Papa from "papaparse";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SLUGS } from "@/lib/validations/order.schema";

export const MAX_ROWS = 5000;

export const TEMPLATE_COLUMNS = [
  "quarter", "organisation", "org_type", "contact_name", "contact_email", "phone", "order_date", "total_kes",
  ...SLUGS, ...SLUGS.map((s) => `price_${s}`),
];

// ---------- parsing (CSV or JSON, normalised headers) ----------
const norm = (h: string) => h.trim().toLowerCase().replace(/[\s-]+/g, "_");
const ALIASES: Record<string, string> = {
  quarter_name: "quarter", organization: "organisation", org: "organisation", org_name: "organisation",
  organisation_name: "organisation", type: "org_type", email: "contact_email", total: "total_kes", date: "order_date",
};

export function parseFile(filename: string, text: string): { rows: Record<string, unknown>[]; error?: string } {
  let raw: unknown[];
  if (filename.toLowerCase().endsWith(".json")) {
    try {
      const j = JSON.parse(text);
      raw = Array.isArray(j) ? j : j?.orders;
    } catch {
      return { rows: [], error: "The file is not valid JSON" };
    }
    if (!Array.isArray(raw)) return { rows: [], error: "JSON must be an array of order objects" };
  } else {
    const r = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ""), {
      header: true, skipEmptyLines: "greedy", transformHeader: norm,
    });
    if (!r.data.length) return { rows: [], error: "The file has no data rows" };
    raw = r.data;
  }
  const rows = raw
    .filter((o): o is Record<string, unknown> => typeof o === "object" && o !== null)
    .map((o) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(o)) out[ALIASES[norm(k)] ?? norm(k)] = v;
      return out;
    });
  return { rows };
}

// ---------- row schema ----------
const blank = (v: unknown) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");
const optText = z.preprocess((v) => (blank(v) ? undefined : String(v).trim()), z.string().max(150).optional());
const qty = z.preprocess((v) => (blank(v) ? 0 : Number(String(v).replace(/,/g, ""))), z.number().int().min(0).max(100000));
const money = z.preprocess(
  (v) => (blank(v) ? undefined : Number(String(v).replace(/[,\s]|kes/gi, ""))),
  z.number().min(0).max(10_000_000).optional(),
);

const shape: Record<string, z.ZodType> = {
  quarter: z.string().trim().min(1, "required"),
  organisation: z.string().trim().min(2, "required").max(150),
  org_type: z.preprocess((v) => (blank(v) ? undefined : String(v).trim().toLowerCase()),
    z.enum(["church", "university", "school"]).optional()),
  contact_name: optText,
  contact_email: z.preprocess((v) => (blank(v) ? undefined : String(v).trim().toLowerCase()), z.string().email().optional()),
  phone: optText,
  order_date: z.preprocess((v) => (blank(v) ? undefined : String(v).trim()),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD").optional()),
  total_kes: money,
};
for (const s of SLUGS) { shape[s] = qty; shape[`price_${s}`] = money; }
const rowSchema = z.object(shape);

// "Q1 2024" -> calendar quarter dates
function parseQuarter(name: string) {
  const m = name.trim().match(/^q([1-4])\s*[-/ ]?\s*(\d{4})$/i);
  if (!m) return null;
  const q = Number(m[1]), y = Number(m[2]);
  const startMonth = (q - 1) * 3 + 1, endMonth = startMonth + 2;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    canonical: `Q${q} ${y}`,
    open: `${y}-${pad(startMonth)}-01`,
    deadline: `${y}-${pad(endMonth)}-${pad(new Date(Date.UTC(y, endMonth, 0)).getUTCDate())}`,
  };
}

const normName = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

// ---------- planning (read-only: decides what each row would do) ----------
export type ImportPayload = {
  quarter_name: string; quarter_open: string; quarter_deadline: string; new_quarter: boolean;
  org: { id: string | null; name: string; type: string | null; contact_name: string | null; contact_email: string | null; phone: string | null };
  items: { slug: string; quantity: number; unit_price: number }[];
  total: number; submitted_at: string;
};
export type RowPlan = {
  row: number; status: "ok" | "skipped" | "error";
  errors: string[]; warnings: string[]; payload?: ImportPayload;
};

export async function planImport(sb: SupabaseClient, rows: Record<string, unknown>[], createMissing: boolean): Promise<RowPlan[]> {
  const [orgsRes, quartersRes, catRes] = await Promise.all([
    sb.from("organisations").select("id,name,contact_email"),
    sb.from("quarters").select("id,name,status,open_date"),
    sb.from("catalogue_items").select("quarter_id,category_slug,price_kes"),
  ]);
  const orgs = (orgsRes.data ?? []) as { id: string; name: string; contact_email: string }[];
  const quarters = (quartersRes.data ?? []) as { id: string; name: string; status: string; open_date: string }[];

  const existingOrders = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("orders").select("organisation_id,quarter_id").order("id").range(from, from + 999);
    (data ?? []).forEach((o) => existingOrders.add(`${o.organisation_id}|${o.quarter_id}`));
    if (!data || data.length < 1000) break;
  }

  const byEmail = new Map(orgs.map((o) => [o.contact_email.toLowerCase(), o]));
  const byName = new Map<string, typeof orgs>();
  for (const o of orgs) byName.set(normName(o.name), [...(byName.get(normName(o.name)) ?? []), o]);
  const quarterByName = new Map(quarters.map((q) => [q.name.toLowerCase(), q]));
  const catPrice = new Map(
    ((catRes.data ?? []) as { quarter_id: string; category_slug: string; price_kes: number }[])
      .map((c) => [`${c.quarter_id}|${c.category_slug}`, Number(c.price_kes)]),
  );

  const parsed = rows.map((r) => rowSchema.safeParse(r));

  // Prices typed on any row apply to the whole quarter
  const quarterPrices = new Map<string, Record<string, number>>();
  for (const p of parsed) {
    if (!p.success) continue;
    const q = parseQuarter(String(p.data.quarter));
    if (!q) continue;
    for (const s of SLUGS) {
      const price = p.data[`price_${s}`];
      if (typeof price === "number" && price > 0) {
        const m = quarterPrices.get(q.canonical) ?? {};
        m[s] ??= price;
        quarterPrices.set(q.canonical, m);
      }
    }
  }

  const seen = new Set<string>();
  return parsed.map((p, i): RowPlan => {
    const row = i + 1;
    const errors: string[] = [], warnings: string[] = [];
    if (!p.success) {
      p.error.issues.forEach((x) => errors.push(`${x.path.join(".") || "row"}: ${x.message}`));
      return { row, status: "error", errors, warnings };
    }
    const d = p.data as Record<string, unknown>;
    const quarterText = String(d.quarter), orgText = String(d.organisation);

    // quarter
    const q = parseQuarter(quarterText);
    if (!q) errors.push(`quarter "${quarterText}" is not recognised (use e.g. Q1 2024)`);
    const existingQ = q ? quarterByName.get(q.canonical.toLowerCase()) : undefined;
    if (existingQ && existingQ.status !== "closed")
      errors.push(`${existingQ.name} is ${existingQ.status}: historical orders can only go into closed or new quarters`);

    // organisation
    const email = d.contact_email as string | undefined;
    let org = email ? byEmail.get(email) : undefined;
    let ambiguous = false;
    if (org) {
      if (normName(org.name) !== normName(orgText)) warnings.push(`matched by email to "${org.name}"`);
    } else {
      const candidates = byName.get(normName(orgText)) ?? [];
      if (candidates.length > 1) { ambiguous = true; errors.push(`"${orgText}" matches ${candidates.length} organisations: add contact_email`); }
      else org = candidates[0];
    }
    let orgKey = org?.id ?? "";
    if (!org && !ambiguous) {
      if (!createMissing) errors.push(`organisation "${orgText}" not found (tick "create missing organisations" to add it)`);
      else if (!d.org_type || !email) errors.push("to create a new organisation, org_type and contact_email are required");
      else orgKey = `new:${email}`;
    }

    // quantities, prices, total
    const quantities = Object.fromEntries(SLUGS.map((s) => [s, Number(d[s])])) as Record<string, number>;
    if (SLUGS.every((s) => quantities[s] === 0)) errors.push("no books ordered on this row");

    const items = SLUGS.map((s) => {
      const own = d[`price_${s}`] as number | undefined;
      const fromQuarter = q ? quarterPrices.get(q.canonical)?.[s] : undefined;
      const cat = existingQ ? catPrice.get(`${existingQ.id}|${s}`) : undefined;
      const price = (own && own > 0 ? own : undefined) ?? fromQuarter ?? (cat && cat > 0 ? cat : undefined);
      if (price === undefined && quantities[s] > 0) errors.push(`no price for ${s}: add price_${s} for this quarter`);
      return { slug: s as string, quantity: quantities[s], unit_price: price ?? 0 };
    });
    const total = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);
    const stated = d.total_kes as number | undefined;
    if (stated !== undefined && Math.round(stated) !== Math.round(total))
      errors.push(`total_kes is ${stated} but quantities × prices come to ${total}`);

    // duplicates
    if (q && orgKey) {
      const key = `${orgKey}|${q.canonical}`;
      if (seen.has(key)) errors.push(`duplicate: ${orgText} already appears for ${q.canonical} in this file`);
      seen.add(key);
    }
    if (errors.length || !q) return { row, status: "error", errors, warnings };

    // already imported earlier
    if (org && existingQ && existingOrders.has(`${org.id}|${existingQ.id}`))
      return { row, status: "skipped", errors, warnings: [...warnings, "an order already exists for this organisation and quarter"] };

    return {
      row, status: "ok", errors, warnings,
      payload: {
        quarter_name: q.canonical, quarter_open: q.open, quarter_deadline: q.deadline, new_quarter: !existingQ,
        org: {
          id: org?.id ?? null, name: orgText, type: (d.org_type as string) ?? null,
          contact_name: (d.contact_name as string) ?? null, contact_email: email ?? null, phone: (d.phone as string) ?? null,
        },
        items, total,
        submitted_at: `${(d.order_date as string) ?? existingQ?.open_date ?? q.open}T12:00:00+03:00`,
      },
    };
  });
}

// ---------- summary + reconciliation by quarter ----------
export function summarise(plans: RowPlan[]) {
  const ok = plans.filter((p) => p.status === "ok");
  const byQuarter = new Map<string, { quarter: string; new_quarter: boolean; orders: number; books: number; value_kes: number }>();
  for (const p of ok) {
    const pl = p.payload!;
    const e = byQuarter.get(pl.quarter_name) ?? { quarter: pl.quarter_name, new_quarter: pl.new_quarter, orders: 0, books: 0, value_kes: 0 };
    e.orders += 1;
    e.books += pl.items.reduce((s, it) => s + it.quantity, 0);
    e.value_kes += pl.total;
    byQuarter.set(pl.quarter_name, e);
  }
  return {
    counts: {
      rows: plans.length,
      importable: ok.length,
      skipped: plans.filter((p) => p.status === "skipped").length,
      errors: plans.filter((p) => p.status === "error").length,
      new_organisations: new Set(ok.filter((p) => !p.payload!.org.id).map((p) => p.payload!.org.contact_email)).size,
      new_quarters: new Set(ok.filter((p) => p.payload!.new_quarter).map((p) => p.payload!.quarter_name)).size,
    },
    by_quarter: [...byQuarter.values()],
    issues: plans.filter((p) => p.status !== "ok" || p.warnings.length)
      .slice(0, 200).map(({ row, status, errors, warnings }) => ({ row, status, errors, warnings })),
    ok,
  };
}