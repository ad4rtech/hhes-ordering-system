import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { sendBulkReminders } from "@/lib/email/reminders";

const schema = z.object({ quarter_id: z.string().uuid() });

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const r = await sendBulkReminders(parsed.data.quarter_id);
  return r.ok ? NextResponse.json({ ok: true, sent: r.sent, skipped: r.skipped }) : NextResponse.json({ error: r.error }, { status: r.status });
}