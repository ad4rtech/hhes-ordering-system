import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { PREF_KEYS, DEFAULT_PREFS, type Prefs } from "@/lib/notifications/types";

const schema = z.object({
  first_name: z.string().trim().min(1, "Enter your first name").max(50).optional(),
  last_name: z.string().trim().min(1, "Enter your last name").max(50).optional(),
  avatar_url: z.string().url().nullable().optional(),
  prefs: z.object(Object.fromEntries(PREF_KEYS.map((k) => [k, z.boolean().optional()])) as Record<(typeof PREF_KEYS)[number], z.ZodOptional<z.ZodBoolean>>).optional(),
}).refine((v) => Object.keys(v).length > 0, "Nothing to update");

export async function PATCH(req: Request) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const v = parsed.data;

  const { data: cur } = await g.supabase.from("profiles").select("first_name,last_name,full_name,notification_prefs").eq("id", g.user.id).single();
  const patch: Record<string, unknown> = {};

  if (v.first_name !== undefined || v.last_name !== undefined) {
    const [fallbackFirst = "", ...rest] = (cur?.full_name ?? "").split(" ");
    const first = v.first_name ?? cur?.first_name ?? fallbackFirst;
    const last = v.last_name ?? cur?.last_name ?? rest.join(" ");
    Object.assign(patch, { first_name: first, last_name: last, full_name: `${first} ${last}`.trim() });
  }
  if (v.avatar_url !== undefined) {
    // only photos in this admin's own storage folder
    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${g.user.id}/`;
    if (v.avatar_url && !v.avatar_url.startsWith(base)) return NextResponse.json({ error: "Invalid photo address" }, { status: 400 });
    patch.avatar_url = v.avatar_url;
  }
  if (v.prefs) patch.notification_prefs = { ...DEFAULT_PREFS, ...((cur?.notification_prefs as Partial<Prefs>) ?? {}), ...v.prefs };

  const { error } = await g.supabase.from("profiles").update(patch).eq("id", g.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}