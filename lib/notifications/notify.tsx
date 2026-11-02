import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import AdminAlert from "@/emails/AdminAlert";
import { DEFAULT_PREFS, PREF_META, type NotificationType, type PrefKey, type Prefs } from "./types";

export type NotifyInput = {
  type: NotificationType; title: string; body: string;
  link?: string; actionLabel?: string; dedupeKey?: string;
  exceptUser?: string; // e.g. don't tell the admin who did it
  pref?: PrefKey;      // which email preference controls the email (none = in-app only)
};

// One in-app notification per admin; an email only to admins whose preference is on.
// Never throws: a notification problem must not break the action that caused it.
export async function notifyAdmins(i: NotifyInput) {
  try {
    const sb = createAdminClient();
    const { data: admins } = await sb.from("profiles").select("id,notification_prefs").eq("role", "admin");
    const targets = (admins ?? []).filter((a) => a.id !== i.exceptUser);
    if (!targets.length) return;

    const { data: inserted } = await sb.from("notifications")
      .upsert(targets.map((a) => ({
        user_id: a.id, type: i.type, title: i.title, body: i.body,
        link: i.link ?? null, action_label: i.actionLabel ?? null, dedupe_key: i.dedupeKey ?? null,
      })), { onConflict: "user_id,dedupe_key", ignoreDuplicates: true })
      .select("user_id");

    if (!i.pref) return;
    const fresh = new Set((inserted ?? []).map((r) => r.user_id)); // duplicates were skipped, so no second email
    const app = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const label = PREF_META.find((p) => p.key === i.pref)?.title ?? "alerts";

    for (const a of targets) {
      const prefs = { ...DEFAULT_PREFS, ...((a.notification_prefs as Partial<Prefs>) ?? {}) };
      if (!fresh.has(a.id) || !prefs[i.pref]) continue;
      const { data } = await sb.auth.admin.getUserById(a.id);
      const to = data.user?.email;
      if (!to) continue;
      await sendEmail({
        to, subject: i.title,
        react: <AdminAlert title={i.title} body={i.body} actionUrl={i.link ? `${app}${i.link}` : undefined}
                 actionLabel={i.actionLabel} prefLabel={label} profileUrl={`${app}/admin/profile`} />,
      });
    }
  } catch (e) {
    console.error("[notify]", e);
  }
}