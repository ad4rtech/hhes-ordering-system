import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { orgActionSchema } from "@/lib/validations/organisation.schema";
import { notifyApproved, notifyRejected } from "@/lib/email/accountEmails";

const ALLOWED: Record<string, string[]> = {
  approve: ["pending", "rejected"],
  reject: ["pending"],
  deactivate: ["approved"],
  reactivate: ["inactive"],
};

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const { id } = await params;

  const { data: org } = await g.supabase.from("organisations")
    .select("id,name,type,contact_name,contact_email,phone,mpesa_phone,status,rejection_reason,created_at,approved_at,user_id")
    .eq("id", id).maybeSingle();
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [orders, overrides] = await Promise.all([
    g.supabase.from("orders")
      .select("id,reference,status,payment_status,total_amount_kes,amount_paid_kes,refund_due,refund_amount_kes,is_historical,submitted_at,quarters(name),mpesa_transactions(id,amount_kes,status,mpesa_receipt_number,transaction_date,created_at)")
      .eq("organisation_id", id).order("created_at", { ascending: false }).limit(50),
    g.supabase.from("deadline_overrides")
      .select("id,original_deadline,new_deadline,reason,granted_at,quarters(name),granted_by_profile:profiles!granted_by(full_name)")
      .eq("organisation_id", id).order("granted_at", { ascending: false }).limit(50),
  ]);

  const { user_id, ...rest } = org;
  return NextResponse.json({ data: { ...rest, has_login: user_id !== null, orders: orders.data ?? [], overrides: overrides.data ?? [] } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const { id } = await params;

  const parsed = orgActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;

  const { data: org } = await g.supabase.from("organisations").select("*").eq("id", id).single();
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!ALLOWED[body.action].includes(org.status))
    return NextResponse.json({ error: `Cannot ${body.action} an organisation that is ${org.status}` }, { status: 409 });
  if (body.action === "reactivate" && !org.user_id)
    return NextResponse.json({ error: "This organisation has no login yet." }, { status: 409 });

  const patch =
    body.action === "approve"    ? { status: "approved", approved_by: g.user.id, approved_at: new Date().toISOString(), rejection_reason: null } :
    body.action === "reject"     ? { status: "rejected", rejection_reason: body.reason } :
    body.action === "deactivate" ? { status: "inactive" } :
                                   { status: "approved" };

  const { error } = await g.supabase.from("organisations").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.action === "approve") await notifyApproved(org);
  if (body.action === "reject") await notifyRejected(org, body.reason);

  return NextResponse.json({ ok: true });
}