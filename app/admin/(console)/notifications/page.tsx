import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FILTERS } from "@/lib/notifications/types";
import { NotificationsView, type NotificationItem } from "@/components/admin/notifications/NotificationsView";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => { const v = sp[k]; return Array.isArray(v) ? v[0] : v; };
  const filter = one("filter") && FILTERS[one("filter")!] ? one("filter")! : "all";
  const limit = Math.min(Math.max(Number(one("limit")) || 20, 20), 200);

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");

  let q = sb.from("notifications").select("id,type,title,body,link,action_label,read_at,created_at", { count: "exact" })
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(limit);
  const f = FILTERS[filter];
  if (f.unread) q = q.is("read_at", null);
  if (f.types) q = q.in("type", f.types);

  const [list, unread] = await Promise.all([
    q,
    sb.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);

  return <NotificationsView items={(list.data ?? []) as NotificationItem[]} total={list.count ?? 0} unread={unread.count ?? 0} filter={filter} limit={limit} />;
}