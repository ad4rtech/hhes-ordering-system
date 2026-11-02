import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { inviteAdmin } from "@/lib/admin/team";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), full_name: z.string().trim().min(2).max(100) });

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: me } = await g.supabase.from("profiles").select("full_name").eq("id", g.user.id).single();
  const r = await inviteAdmin({ email: parsed.data.email, fullName: parsed.data.full_name, invitedByName: me?.full_name || "An administrator" });
  return r.ok ? NextResponse.json({ ok: true }, { status: 201 }) : NextResponse.json({ error: r.error }, { status: r.status });
}