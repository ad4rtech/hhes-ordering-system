import type { SupabaseClient } from "@supabase/supabase-js";

export type OrgRow = {
  id: string; name: string; type: "church" | "university" | "school";
  contact_name: string; contact_email: string; phone: string | null;
  status: "pending" | "approved" | "inactive" | "rejected";
  rejection_reason: string | null; created_at: string; approved_at: string | null;
  has_login: boolean;
};

export type OrgOrder = {
  id: string; reference: string; status: string; payment_status: string;
  total_amount_kes: number; amount_paid_kes: number; refund_due: boolean; refund_amount_kes: number;
  is_historical: boolean; submitted_at: string | null; quarters: { name: string } | null;
  mpesa_transactions: { id: string; amount_kes: number; status: string; mpesa_receipt_number: string | null; transaction_date: string | null; created_at: string }[];
};

export type OrgOverride = {
  id: string; original_deadline: string; new_deadline: string; reason: string; granted_at: string;
  quarters: { name: string } | null; granted_by_profile: { full_name: string | null } | null;
};

export type OrgDetail = OrgRow & { mpesa_phone: string | null; orders: OrgOrder[]; overrides: OrgOverride[] };

export type OrgQuery = { q?: string; status?: string; type?: string; exclude?: string; page?: number; pageSize?: number };

const COLS = "id,name,type,contact_name,contact_email,phone,status,rejection_reason,created_at,approved_at,user_id";
const STATUSES = ["pending", "approved", "inactive", "rejected"];
const TYPES = ["church", "university", "school"];

export async function listOrganisations(sb: SupabaseClient, p: OrgQuery) {
  const pageSize = Math.min(Math.max(Math.floor(p.pageSize ?? 10) || 10, 1), 100);
  const page = Math.max(Math.floor(p.page ?? 1) || 1, 1);

  let q = sb.from("organisations").select(COLS, { count: "exact" });
  if (p.status && STATUSES.includes(p.status)) q = q.eq("status", p.status);
  if (p.exclude && STATUSES.includes(p.exclude)) q = q.neq("status", p.exclude);
  if (p.type && TYPES.includes(p.type)) q = q.eq("type", p.type);

  // Strip characters that would break PostgREST's filter syntax
  const term = (p.q ?? "").replace(/[%,()*\\:"']/g, " ").trim();
  if (term) q = q.or(`name.ilike.%${term}%,contact_email.ilike.%${term}%,contact_name.ilike.%${term}%`);

  q = p.status === "pending" ? q.order("created_at", { ascending: false }) : q.order("name");

  const from = (page - 1) * pageSize;
  const { data, count, error } = await q.range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  const rows = (data ?? []).map(({ user_id, ...r }) => ({ ...r, has_login: user_id !== null })) as OrgRow[];
  return { rows, count: count ?? 0, page, pageSize };
}