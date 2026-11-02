import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { mpesaPhoneSchema } from "@/lib/validations/organisation.schema";

const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const schema = z.object({
  contact_name: z.string().trim().min(2, "Enter the contact person's name").max(100).optional(),
  phone: z.preprocess(blank, z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, "Enter a valid phone number").nullable()).optional(),
  location: z.preprocess(blank, z.string().trim().max(150).nullable()).optional(),
  mpesa_phone: z.preprocess(blank, mpesaPhoneSchema.nullable()).optional(),
  avatar_url: z.string().url().nullable().optional(),
}).refine((v) => Object.keys(v).length > 0, "Nothing to update");

export async function PATCH(req: Request) {
  const g = await requireUser();
  if (g.error) return g.error;

  const admin = createAdminClient();
  const { data: org } = await admin.from("organisations").select("id,status").eq("user_id", g.user.id).maybeSingle();
  if (!org || org.status !== "approved") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { avatar_url, ...fields } = parsed.data;

  if (Object.keys(fields).length) {
    // Only these four fields can be changed here; the name, type and status stay with HHES
    const { error } = await admin.from("organisations").update(fields).eq("id", org.id);
    if (error) return NextResponse.json({ error: "Couldn't save your profile. Please try again." }, { status: 500 });
  }

  if (avatar_url !== undefined) {
    // only a picture stored in this user's own folder
    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${g.user.id}/`;
    if (avatar_url && !avatar_url.startsWith(base)) return NextResponse.json({ error: "Invalid photo address" }, { status: 400 });
    const { error } = await admin.from("profiles").update({ avatar_url }).eq("id", g.user.id);
    if (error) return NextResponse.json({ error: "Couldn't update the photo. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}