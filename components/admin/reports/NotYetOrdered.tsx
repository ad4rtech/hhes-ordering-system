"use client";

import { useMemo, useState } from "react";
import { ChevronDown, CircleAlert, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TypeBadge } from "@/components/admin/StatusBadges";
import { api, toastFailure } from "@/lib/api";
import { notify } from "@/lib/notify";
import type { ReportData, RQuarter } from "@/lib/admin/reports";

export function NotYetOrdered({ orgs, quarter }: { orgs: ReportData["notOrdered"]; quarter: RQuarter }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const canRemind = quarter.status === "published";

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return orgs.filter((o) => (!type || o.type === type) && (!t || o.name.toLowerCase().includes(t) || o.email.toLowerCase().includes(t)));
  }, [orgs, q, type]);

  async function remind(o: ReportData["notOrdered"][number]) {
    setBusy(o.id);
    const res = await api("/api/reminders", { json: { organisation_id: o.id, quarter_id: quarter.id }, silent: true });
    setBusy(null);
    if (res.ok) {
      setSent((s) => new Set(s).add(o.id));
      notify("admin.report.reminder_sent", { org: o.name });
    } else if (/already sent/i.test(res.error)) {
      setSent((s) => new Set(s).add(o.id));
      notify("admin.report.reminder_today", { org: o.name });
    } else toastFailure(res);
  }

  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-3 font-sans text-lg font-semibold text-ink">
            <CircleAlert size={22} className="text-attention" aria-hidden /> Not Yet Ordered
          </h2>
          <span className="text-[15px] text-muted">{orgs.length} {orgs.length === 1 ? "Organisation" : "Organisations"}</span>
        </div>
        {!canRemind && <p className="mt-2 text-sm text-muted">This quarter isn't open, so reminders are off.</p>}
        <div className="mt-4 flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." aria-label="Search organisations"
              className="h-11 w-full rounded-field border border-line bg-surface pl-10 pr-3 text-[15px] text-ink placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15" />
          </div>
          <label className="relative flex h-11 items-center rounded-field border border-line bg-surface pl-3.5 pr-9 text-[15px] focus-within:border-primary">
            <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Organisation type"
              className="cursor-pointer appearance-none bg-transparent font-medium text-ink focus:outline-none">
              <option value="">All Types</option><option value="church">Church</option>
              <option value="university">University</option><option value="school">School</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 text-muted" aria-hidden />
          </label>
        </div>
      </div>

      <div className="mt-5 max-h-[420px] overflow-auto border-t border-line">
        <table className="w-full min-w-[460px] text-left">
          <thead className="sticky top-0 bg-panel">
            <tr>
              <th className="px-6 py-3.5 text-sm font-medium text-muted">Organisation</th>
              <th className="px-6 py-3.5 text-sm font-medium text-muted">Contact Email</th>
              <th className="px-6 py-3.5 text-right text-sm font-medium text-muted">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-10 text-center text-[15px] text-muted">
                {orgs.length === 0 ? "Every approved organisation has ordered." : "No organisations match your search."}
              </td></tr>
            ) : rows.map((o) => (
              <tr key={o.id}>
                <td className="px-6 py-4">
                  <p className="text-[15px] font-medium text-ink">{o.name}</p>
                  <span className="mt-1 inline-block"><TypeBadge type={o.type} /></span>
                </td>
                <td className="break-all px-6 py-4 text-[15px] text-ink">{o.email}</td>
                <td className="px-6 py-4 text-right">
                  <Button variant="outline" size="sm" loading={busy === o.id} disabled={!canRemind || sent.has(o.id)} onClick={() => remind(o)}>
                    {sent.has(o.id) ? "Sent" : "Reminder"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}