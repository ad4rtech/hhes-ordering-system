import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import AdminInvite from "@/emails/AdminInvite";

export type AdminMember = {
  id: string; name: string; email: string; avatarUrl: string | null;
  status: "active" | "pending"; invitedAt: string; lastSignIn: string | null;
};
export type TeamResult = { ok: true } | { ok: false; status: number; error: string };

export async function listAdmins(): Promise<AdminMember[]> {
  const sb = createAdminClient();
  const { data: profs } = await sb.from("profiles").select("id,full_name,avatar_url,created_at").eq("role", "admin").order("created_at");
  return Promise.all((profs ?? []).map(async (p) => {
    const u = (await sb.auth.admin.getUserById(p.id)).data.user;
    return {
      id: p.id, name: p.full_name || u?.email || "Admin", email: u?.email ?? "", avatarUrl: p.avatar_url,
      status: u?.last_sign_in_at ? "active" : "pending", invitedAt: p.created_at, lastSignIn: u?.last_sign_in_at ?? null,
    } as AdminMember;
  }));
}

export async function inviteAdmin(input: { email: string; fullName: string; invitedByName: string }): Promise<TeamResult> {
  const sb = createAdminClient();
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const [first = "", ...rest] = fullName.split(/\s+/);

  const { data, error } = await sb.auth.admin.generateLink({ type: "invite", email, options: { data: { full_name: fullName } } });
  if (error || !data.user) {
    const taken = error?.code === "email_exists" || /already|registered|exists/i.test(error?.message ?? "");
    return { ok: false, status: taken ? 409 : 400, error: taken ? "An account with this email already exists." : (error?.message ?? "Invite failed") };
  }
  const id = data.user.id;

  const { error: pErr } = await sb.from("profiles").insert({ id, role: "admin", full_name: fullName, first_name: first, last_name: rest.join(" ") || null });
  const { error: mErr } = pErr ? { error: pErr } : await sb.auth.admin.updateUserById(id, { app_metadata: { role: "admin" } });
  if (pErr || mErr) { // leave nothing half-created
    await sb.from("profiles").delete().eq("id", id);
    await sb.auth.admin.deleteUser(id);
    return { ok: false, status: 500, error: "Couldn't create the admin account. Please try again." };
  }

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=invite&next=/set-password`;
  if (process.env.NODE_ENV !== "production") console.log("[invite link]", link); // handy while Resend is in sandbox
  await sendEmail({ to: email, subject: "You've been invited to the HHES admin portal",
    react: <AdminInvite name={first || fullName} invitedBy={input.invitedByName} link={link} /> });
  return { ok: true };
}

// Only an invitation that was never used can be revoked
export async function revokePendingAdmin(id: string): Promise<TeamResult & { name?: string; email?: string }> {
  const sb = createAdminClient();
  const [{ data: prof }, { data: u }] = await Promise.all([
    sb.from("profiles").select("full_name").eq("id", id).eq("role", "admin").maybeSingle(),
    sb.auth.admin.getUserById(id),
  ]);
  if (!prof || !u.user) return { ok: false, status: 404, error: "Admin not found" };
  if (u.user.last_sign_in_at) return { ok: false, status: 409, error: "This admin has already signed in, so the invitation can't be revoked." };

  await sb.from("profiles").delete().eq("id", id);
  const { error } = await sb.auth.admin.deleteUser(id);
  if (error) return { ok: false, status: 500, error: "Couldn't revoke the invitation. Please try again." };
  return { ok: true, name: prof.full_name ?? "", email: u.user.email ?? "" };
}