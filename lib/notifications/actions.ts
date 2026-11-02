import { createClient } from "@/lib/supabase/client";

export async function markRead(id: string) {
  const { error } = await createClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  return !error;
}

export async function markAllRead(): Promise<number | null> {
  const { data, error } = await createClient().from("notifications")
    .update({ read_at: new Date().toISOString() }).is("read_at", null).select("id");
  return error ? null : (data?.length ?? 0);
}

export async function deleteNotification(id: string) {
  const { error } = await createClient().from("notifications").delete().eq("id", id);
  return !error;
}