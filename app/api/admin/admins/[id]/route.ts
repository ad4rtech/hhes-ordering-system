import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { inviteAdmin, revokePendingAdmin } from "@/lib/admin/team";

const schema = z.object({ action: z.enum(["resend", "revoke"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const { id } = await params;
  if (id === g.user.id) return NextResponse.json({ error: "You can't change your own invitation" }, { status: 409 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const r = await revokePendingAdmin(id);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  if (parsed.data.action === "revoke") return NextResponse.json({ ok: true });

  // Resend: the old link is gone, so create a fresh invitation
  const { data: me } = await g.supabase.from("profiles").select("full_name").eq("id", g.user.id).single();
  const again = await inviteAdmin({ email: r.email!, fullName: r.name || r.email!, invitedByName: me?.full_name || "An administrator" });
  return again.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: again.error }, { status: again.status });
}