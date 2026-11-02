import { api, toastFailure } from "@/lib/api";
import { notify } from "@/lib/notify";
import type { OrgRow } from "./organisations";

type Body = { action: "approve" } | { action: "reject"; reason: string } | { action: "deactivate" } | { action: "reactivate" };

const SUCCESS = {
  approve: "admin.org.approved", reject: "admin.org.rejected",
  deactivate: "admin.org.deactivated", reactivate: "admin.org.reactivated",
} as const;

export async function orgAction(org: Pick<OrgRow, "id" | "name" | "contact_email" | "status">, body: Body): Promise<boolean> {
  const res = await api(`/api/organisations/${org.id}`, { method: "PATCH", json: body, silent: true });
  if (res.ok) {
    notify(SUCCESS[body.action], { org: org.name, email: org.contact_email });
    return true;
  }
  if (/no login yet/i.test(res.error)) notify("admin.org.no_login");
  else if (/^Cannot (approve|reject|deactivate|reactivate)/i.test(res.error)) notify("admin.org.invalid_state", { org: org.name, status: org.status });
  else if (res.fields?.reason) notify("admin.org.reason_required");
  else toastFailure(res);
  return false;
}