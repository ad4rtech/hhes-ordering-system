"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TypeBadge } from "./StatusBadges";
import { RejectDialog } from "./RejectDialog";
import { orgAction } from "@/lib/admin/orgActions";
import { fmtDay, fmtTime } from "@/lib/utils/format";
import type { OrgRow } from "@/lib/admin/organisations";

const TH = "px-6 py-4 text-[15px] font-medium text-muted";

export function PendingRegistrations({ rows }: { rows: OrgRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<OrgRow | null>(null);

  async function approve(org: OrgRow) {
    setBusy(org.id);
    const ok = await orgAction(org, { action: "approve" });
    setBusy(null);
    if (ok) router.refresh();
  }

  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <h2 className="flex items-center gap-3 font-sans text-lg font-semibold text-ink">
          <UserPlus size={22} className="text-attention" aria-hidden /> Pending Registrations
        </h2>
        {rows.length > 0 && <Badge tone="attention">{rows.length} {rows.length === 1 ? "Request" : "Requests"}</Badge>}
      </div>

      {rows.length === 0 ? (
        <p className="border-t border-line px-6 py-10 text-center text-muted">No registrations are waiting for approval.</p>
      ) : (
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[780px] text-left">
            <thead className="bg-panel">
              <tr>
                <th className={TH}>Organisation Name</th><th className={TH}>Type</th>
                <th className={TH}>Contact Details</th><th className={TH}>Date Submitted</th>
                <th className={`${TH} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="px-6 py-5 text-[15px] font-medium text-ink">{o.name}</td>
                  <td className="px-6 py-5"><TypeBadge type={o.type} /></td>
                  <td className="px-6 py-5">
                    <p className="text-[15px] font-medium text-ink">{o.contact_name}</p>
                    <p className="text-sm text-muted">{o.contact_email}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[15px] text-ink">{fmtDay(o.created_at)}</p>
                    <p className="text-sm text-muted">{fmtTime(o.created_at)}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-3">
                      <Button variant="dangerOutline" size="sm" disabled={busy === o.id} onClick={() => setRejecting(o)}>Reject...</Button>
                      <Button variant="positive" size="sm" loading={busy === o.id} onClick={() => approve(o)}>Approve</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RejectDialog org={rejecting} onClose={() => setRejecting(null)} onDone={() => { setRejecting(null); router.refresh(); }} />
    </section>
  );
}