import { NextResponse, after } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { createOrAdoptOrganisation, ensureProfile } from "@/lib/auth/org";
import { notifyRegistration } from "@/lib/email/accountEmails";
import { onRegistration } from "@/lib/notifications/events"; // adjust to where onRegistration lives

const schema = z.object({
  org_name: z.string().trim().min(2).max(150),
  org_type: z.enum(["church", "university", "school"]),
  contact_name: z.string().trim().min(2).max(100),
});

export async function POST(req: Request) {
  const g = await requireUser();
  if (g.error) return g.error;
  const email = g.user.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Your account has no email address" }, { status: 400 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const admin = createAdminClient();
  const role = await ensureProfile(admin, g.user);
  if (role === "admin") return NextResponse.json({ error: "Admins don't register organisations" }, { status: 403 });

  const { data: existing } = await admin.from("organisations").select("id").eq("user_id", g.user.id).maybeSingle();
  if (existing) return NextResponse.json({ error: "Your organisation has already been registered" }, { status: 409 });

  const { error } = await createOrAdoptOrganisation(admin, g.user.id, { ...parsed.data, email });
  if (error) {
    const taken = error.code === "23505";
    return NextResponse.json(
      { error: taken ? "An organisation is already registered with this email address." : "Registration failed. Please try again." },
      { status: taken ? 409 : 500 },
    );
  }

  await notifyRegistration({ contact_email: email, contact_name: parsed.data.contact_name, name: parsed.data.org_name });
  after(() => onRegistration(parsed.data.org_name, g.user.id));
  return NextResponse.json({ ok: true, status: "pending" }, { status: 201 });
}