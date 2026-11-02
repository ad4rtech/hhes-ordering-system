import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations/organisation.schema";
import { notifyRegistration } from "@/lib/email/accountEmails";
import { createOrAdoptOrganisation } from "@/lib/auth/org";
import { onRegistration } from "@/lib/notifications/events"; // adjust to where onRegistration lives

export async function POST(req: Request) {
  const parsed = registerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const v = parsed.data;

  const admin = createAdminClient();

  // 1. Create login (email pre-confirmed; access is gated by org status, not email confirmation)
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email: v.email,
    password: v.password,
    email_confirm: true,
    app_metadata: { role: "org_rep" },
    user_metadata: { full_name: v.contact_name },
  });
  if (authErr || !created.user) {
    console.error("[register] createUser failed:", authErr?.message, (authErr as any)?.cause ?? authErr);
    const taken = authErr?.message?.toLowerCase().includes("already");
    return NextResponse.json(
      { error: taken ? "An account with this email already exists." : "Could not create account." },
      { status: taken ? 409 : 400 }
    );
  }
  const userId = created.user.id;

  // 2. Profile + organisation (pending). Roll back the auth user if anything fails.
  const { error: pErr } = await admin.from("profiles")
    .insert({ id: userId, role: "org_rep", full_name: v.contact_name });

  const { error: oErr } = pErr
    ? { error: pErr }
    : await createOrAdoptOrganisation(admin, userId, {
        org_name: v.org_name, org_type: v.org_type, contact_name: v.contact_name,
        email: v.email, phone: v.phone, mpesa_phone: v.mpesa_phone,
      });
  if (oErr) {
    console.error("[register] profile/organisation failed:", oErr.message);
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }

  await notifyRegistration({ contact_email: v.email, contact_name: v.contact_name, name: v.org_name });
  after(() => onRegistration(v.org_name, userId));

  return NextResponse.json({ ok: true, status: "pending" }, { status: 201 });
}