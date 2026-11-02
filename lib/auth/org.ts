import type { SupabaseClient, User } from "@supabase/supabase-js";

type Role = "admin" | "org_rep";

// Makes sure a signed-in user has a profile row and a role in app_metadata
export async function ensureProfile(admin: SupabaseClient, user: User): Promise<Role> {
  const { data: profile, error: selErr } = await admin
    .from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (selErr) {
    // Never write on a failed read: defaulting to org_rep here would demote an admin
    console.error("[ensureProfile] profile lookup failed:", selErr.message);
    return (user.app_metadata?.role as Role | undefined) ?? "org_rep";
  }

  const role: Role = (profile?.role as Role | undefined) ?? "org_rep";

  if (!profile) {
    const { error: insErr } = await admin.from("profiles").upsert(
      {
        id: user.id,
        role,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          null,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (insErr) console.error("[ensureProfile] profile insert failed:", insErr.message);
  }

  if (user.app_metadata?.role !== role) {
    const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { role },
    });
    if (updErr) console.error("[ensureProfile] app_metadata update failed:", updErr.message);
  }

  return role;
}

// New organisation (pending), or adopts an imported history shell with the same email
export async function createOrAdoptOrganisation(
  admin: SupabaseClient,
  userId: string,
  f: {
    org_name: string;
    org_type: string;
    contact_name: string;
    email: string;
    phone?: string | null;
    mpesa_phone?: string | null;
  },
) {
  const { data: shell, error: shellErr } = await admin
    .from("organisations")
    .select("id")
    .eq("contact_email", f.email)
    .is("user_id", null)
    .maybeSingle();
  if (shellErr) return { error: shellErr };

  const fields = {
    user_id: userId,
    name: f.org_name,
    type: f.org_type,
    contact_name: f.contact_name,
    contact_email: f.email,
    phone: f.phone ?? null,
    mpesa_phone: f.mpesa_phone ?? null,
    status: "pending",
  };

  const { error } = shell
    ? await admin.from("organisations").update(fields).eq("id", shell.id)
    : await admin.from("organisations").insert(fields);

  return { error };
}