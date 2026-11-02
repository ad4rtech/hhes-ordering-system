"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Switch } from "@/components/ui/Switch";
import { orgAction } from "@/lib/admin/orgActions";
import type { OrgRow } from "@/lib/admin/organisations";

export function AccessSwitch({ org, onChanged }: { org: OrgRow; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const enabled = org.status === "approved";

  async function run(action: "deactivate" | "reactivate") {
    setBusy(true);
    const ok = await orgAction(org, { action });
    setBusy(false);
    setConfirm(false);
    if (ok) onChanged();
  }

  // stopPropagation: the switch sits inside a clickable table row
  return (
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-3">
        <Switch checked={enabled} disabled={busy} label={`${enabled ? "Disable" : "Enable"} access for ${org.name}`}
          onChange={(next) => (next ? run("reactivate") : setConfirm(true))} />
        <span className={enabled ? "text-ink" : "text-muted"}>{enabled ? "Enabled" : "Disabled"}</span>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} tone="danger" loading={busy}
        title={`Deactivate ${org.name}?`}
        description="They won't be able to sign in or place orders. Their order history is kept, and you can turn access back on at any time."
        confirmLabel="Deactivate" onConfirm={() => run("deactivate")} />
    </div>
  );
}