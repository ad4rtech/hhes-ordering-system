import { NextResponse, after } from "next/server";
import { requireUser, requireAdmin } from "@/lib/auth/guards";
import { patchQuarterSchema } from "@/lib/validations/quarter.schema";
import { notifyQuarterOpened } from "@/lib/email/quarterEmails";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const g = await requireUser();
  if (g.error) return g.error;
  const { id } = await params;
  const { data } = await g.supabase.from("quarters").select("*").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const { id } = await params;

  const parsed = patchQuarterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;

  const { data: q } = await g.supabase.from("quarters").select("*").eq("id", id).single();
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if ("action" in body) {
    if (body.action === "publish") {
      const { error } = await g.supabase.rpc("publish_quarter", { p_quarter_id: id });
      if (error) return NextResponse.json({ error: error.message }, { status: 409 });
      after(() => notifyQuarterOpened(id));
      return NextResponse.json({ ok: true, status: "published" });
    }
    // close
    if (q.status !== "published")
      return NextResponse.json({ error: "Only a published quarter can be closed" }, { status: 409 });
    const { error } = await g.supabase.from("quarters")
      .update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status: "closed" });
  }

  // Edit details: draft only
  if (q.status !== "draft")
    return NextResponse.json({ error: "Only draft quarters can be edited" }, { status: 409 });
  const open = body.open_date ?? q.open_date;
  const deadline = body.deadline_date ?? q.deadline_date;
  if (deadline < open)
    return NextResponse.json({ error: "Deadline must be on or after the open date" }, { status: 400 });

  const { data, error } = await g.supabase.from("quarters").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}