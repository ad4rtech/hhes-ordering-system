import type { SupabaseClient } from "@supabase/supabase-js";

export type QuarterRow = {
  id: string; name: string; open_date: string; deadline_date: string;
  status: "draft" | "published" | "closed"; closed_at: string | null;
  orders: number; paid_orders: number; revenue_kes: number; priced_categories: number; days_left: number;
};

export type ExtensionRow = {
  id: string; organisation_id: string; quarter_id: string; original_deadline: string; new_deadline: string;
  reason: string; granted_at: string; organisations: { name: string } | null; quarters: { name: string } | null;
  granted_by_profile: { full_name: string | null } | null;
};

const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export async function loadQuarters(sb: SupabaseClient) {
  const [q, stats, ext, orgs] = await Promise.all([
    sb.from("quarters").select("id,name,open_date,deadline_date,status,closed_at").order("open_date", { ascending: false }),
    sb.rpc("quarter_stats"),
    sb.from("deadline_overrides")
      .select("id,organisation_id,quarter_id,original_deadline,new_deadline,reason,granted_at,organisations(name),quarters(name),granted_by_profile:profiles!granted_by(full_name)")
      .order("granted_at", { ascending: false }).limit(200),
    sb.from("organisations").select("id", { count: "exact", head: true }).eq("status", "approved"),
  ]);
  if (q.error) throw new Error(q.error.message);

  type Stat = { quarter_id: string; orders: number; paid_orders: number; revenue_kes: number; priced_categories: number };
  const byId = new Map(((stats.data ?? []) as Stat[]).map((s) => [s.quarter_id, s]));
  const today = new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10); // Nairobi date

  const quarters = (q.data ?? []).map((r) => {
    const s = byId.get(r.id);
    return {
      ...r, orders: Number(s?.orders ?? 0), paid_orders: Number(s?.paid_orders ?? 0),
      revenue_kes: Number(s?.revenue_kes ?? 0), priced_categories: Number(s?.priced_categories ?? 0),
      days_left: daysBetween(today, r.deadline_date),
    };
  }) as QuarterRow[];

  return { quarters, extensions: (ext.data ?? []) as unknown as ExtensionRow[], approvedOrgs: orgs.count ?? 0 };
}