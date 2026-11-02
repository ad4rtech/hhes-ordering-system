import { api, toastFailure } from "@/lib/api";
import { notify } from "@/lib/notify";
import { fmtDate } from "@/lib/utils/format";

type Res = { status: number; error: string; fields?: Record<string, string[]> };

function fail(res: Res, vars: Record<string, string> = {}) {
  const m = res.error;
  if (/All six categories need a price/i.test(m)) notify("admin.quarter.publish_blocked_prices");
  else if (/Another quarter is already published/i.test(m)) notify("admin.quarter.publish_blocked_active", vars);
  else if (/Only draft quarters can be edited/i.test(m)) notify("admin.quarter.not_editable");
  else if (/Only a published quarter can be closed/i.test(m)) notify("admin.quarter.not_published");
  else if (/Deadline must be on or after/i.test(m)) notify("admin.quarter.dates_invalid");
  else if (/already exists/i.test(m)) notify("admin.quarter.name_taken", vars);
  else if (/Overrides apply to the published quarter only/i.test(m)) notify("admin.override.not_open");
  else if (/Organisation is not approved/i.test(m)) notify("admin.override.org_not_approved");
  else if (/New deadline must be after/i.test(m)) {
    const d = m.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
    notify("admin.override.date_invalid", { date: d ? fmtDate(d) : "the current deadline" });
  } else if (res.fields?.reason) notify("admin.override.reason_required");
  else toastFailure(res);
}

type Dates = { name: string; open_date: string; deadline_date: string };

export async function createQuarter(v: Dates) {
  const res = await api("/api/quarters", { json: v, silent: true });
  if (res.ok) { notify("admin.quarter.created", { quarter: v.name }); return true; }
  fail(res, { quarter: v.name }); return false;
}

export async function updateQuarter(id: string, v: Dates) {
  const res = await api(`/api/quarters/${id}`, { method: "PATCH", json: v, silent: true });
  if (res.ok) { notify("admin.quarter.updated"); return true; }
  fail(res, { quarter: v.name }); return false;
}

export async function publishQuarter(q: { id: string; name: string }, activeName = "the open quarter") {
  const res = await api(`/api/quarters/${q.id}`, { method: "PATCH", json: { action: "publish" }, silent: true });
  if (res.ok) { notify("admin.quarter.published", { quarter: q.name }); return true; }
  fail(res, { quarter: activeName }); return false;
}

export async function closeQuarter(q: { id: string; name: string }) {
  const res = await api(`/api/quarters/${q.id}`, { method: "PATCH", json: { action: "close" }, silent: true });
  if (res.ok) { notify("admin.quarter.closed", { quarter: q.name }); return true; }
  fail(res); return false;
}

export async function grantExtension(v: { organisation_id: string; quarter_id: string; new_deadline: string; reason: string }, orgName: string) {
  const res = await api("/api/overrides", { json: v, silent: true });
  if (res.ok) { notify("admin.override.granted", { org: orgName, date: fmtDate(v.new_deadline) }); return true; }
  fail(res); return false;
}