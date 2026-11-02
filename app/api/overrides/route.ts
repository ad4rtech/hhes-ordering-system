import { NextResponse, after } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { overrideSchema } from "@/lib/validations/quarter.schema";
import { onOverrideGranted } from "@/lib/notifications/events"; // adjust to where onOverrideGranted lives

export async function GET(req: Request) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const quarterId = new URL(req.url).searchParams.get("quarter_id");

  let q = g.supabase.from("deadline_overrides")
    .select("*, organisations(name,type), quarters(name), granted_by_profile:profiles!granted_by(full_name)")
    .order("granted_at", { ascending: false });
  if (quarterId) q = q.eq("quarter_id", quarterId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const parsed = overrideSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const v = parsed.data;

  const { data: quarter } = await g.supabase.from("quarters").select("*").eq("id", v.quarter_id).single();
  if (!quarter || quarter.status !== "published")
    return NextResponse.json({ error: "Overrides apply to the published quarter only" }, { status: 409 });

  const { data: org } = await g.supabase.from("organisations").select("status").eq("id", v.organisation_id).single();
  if (org?.status !== "approved")
    return NextResponse.json({ error: "Organisation is not approved" }, { status: 409 });

  // Chain from the org's current effective deadline (an earlier override, if any)
  const { data: last } = await g.supabase.from("deadline_overrides").select("new_deadline")
    .eq("organisation_id", v.organisation_id).eq("quarter_id", v.quarter_id)
    .order("granted_at", { ascending: false }).limit(1).maybeSingle();
  const original = last?.new_deadline ?? quarter.deadline_date;

  if (v.new_deadline <= original)
    return NextResponse.json({ error: `New deadline must be after ${original}` }, { status: 400 });

  const { data, error } = await g.supabase.from("deadline_overrides").insert({
    organisation_id: v.organisation_id, quarter_id: v.quarter_id,
    original_deadline: original, new_deadline: v.new_deadline,
    reason: v.reason, granted_by: g.user.id,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  after(() => onOverrideGranted(data.id));
  return NextResponse.json({ data }, { status: 201 });
}