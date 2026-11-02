import { api, toastFailure } from "@/lib/api";
import { notify } from "@/lib/notify";

export async function remindOrg(o: { id: string; name: string }, quarterId: string): Promise<"sent" | "already" | "failed"> {
  const res = await api("/api/reminders", { json: { organisation_id: o.id, quarter_id: quarterId }, silent: true });
  if (res.ok) { notify("admin.report.reminder_sent", { org: o.name }); return "sent"; }
  if (/already sent/i.test(res.error)) { notify("admin.report.reminder_today", { org: o.name }); return "already"; }
  toastFailure(res);
  return "failed";
}

export async function remindAll(quarterId: string): Promise<boolean> {
  const res = await api<{ sent: number; skipped: number }>("/api/reminders/bulk", { json: { quarter_id: quarterId }, silent: true });
  if (!res.ok) { toastFailure(res); return false; }
  if (res.data.sent > 0) notify("admin.report.bulk_sent", { sent: res.data.sent, skipped: res.data.skipped });
  else notify("admin.report.bulk_none");
  return true;
}