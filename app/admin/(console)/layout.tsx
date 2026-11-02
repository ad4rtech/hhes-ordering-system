import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const [{ data: me }, unread] = await Promise.all([
    supabase.from("profiles").select("role,full_name,avatar_url").eq("id", user.id).single(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);
  if (me?.role !== "admin") redirect("/admin/login");

  return (
    <div className="flex min-h-dvh flex-col bg-chrome">
      <AdminTopbar name={me.full_name || user.email || "Admin"} avatarUrl={me.avatar_url ?? null} userId={user.id} unread={unread.count ?? 0} />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-6">{children}</main>
      <PublicFooter variant="admin" wide />
    </div>
  );
}