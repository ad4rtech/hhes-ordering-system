import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

export type RepNotificationType =
  | "quarter_opened" | "deadline_reminder" | "payment_received" | "payment_failed"
  | "order_ready" | "order_collected" | "refund_processed";

export type RepNotice = { type: RepNotificationType; title: string; body: string; link?: string; actionLabel?: string; dedupeKey?: string };

// Never throws: a notification problem must not break the action that caused it
export async function notifyUsers(userIds: string[], n: RepNotice) {
  try {
    if (!userIds.length) return;
    await createAdminClient().from("notifications").upsert(
      userIds.map((id) => ({
        user_id: id, type: n.type, title: n.title, body: n.body,
        link: n.link ?? null, action_label: n.actionLabel ?? null, dedupe_key: n.dedupeKey ?? null,
      })),
      { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
    );
  } catch (e) {
    console.error("[notify:rep]", e);
  }
}

export async function notifyOrg(orgId: string, n: RepNotice) {
  const { data } = await createAdminClient().from("organisations").select("user_id").eq("id", orgId).maybeSingle();
  if (data?.user_id) await notifyUsers([data.user_id], n);
}