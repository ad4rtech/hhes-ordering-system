import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listAdmins } from "@/lib/admin/team";
import { DEFAULT_PREFS, type Prefs } from "@/lib/notifications/types";
import { ProfileView } from "@/components/admin/profile/ProfileView";
import { ProfileNotices } from "@/components/admin/profile/ProfileNotices";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");

  const [{ data: p }, admins] = await Promise.all([
    sb.from("profiles").select("first_name,last_name,full_name,avatar_url,notification_prefs").eq("id", user.id).single(),
    listAdmins(),
  ]);
  const [fallbackFirst = "", ...rest] = (p?.full_name ?? "").split(" ");

  return (
    <>
      <Suspense><ProfileNotices /></Suspense>
      <ProfileView
        userId={user.id} email={user.email ?? ""} pendingEmail={user.new_email ?? null} avatarUrl={p?.avatar_url ?? null}
        firstName={p?.first_name ?? fallbackFirst} lastName={p?.last_name ?? rest.join(" ")}
        prefs={{ ...DEFAULT_PREFS, ...((p?.notification_prefs as Partial<Prefs>) ?? {}) }} admins={admins}
      />
    </>
  );
}