"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { SettingsCard } from "./SettingsCard";
import { api } from "@/lib/api";
import { notify } from "@/lib/notify";
import { PREF_META, type PrefKey, type Prefs } from "@/lib/notifications/types";

export function PrefsCard({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [busy, setBusy] = useState<PrefKey | null>(null);

  async function toggle(key: PrefKey, next: boolean) {
    setPrefs((p) => ({ ...p, [key]: next }));
    setBusy(key);
    const res = await api("/api/profile", { method: "PATCH", json: { prefs: { [key]: next } }, silent: true });
    setBusy(null);
    if (res.ok) notify("admin.profile.prefs_saved");
    else { setPrefs((p) => ({ ...p, [key]: !next })); notify("admin.profile.failed"); }
  }

  return (
    <SettingsCard id="notifications" title="Notification Preferences" subtitle="Choose which alerts you want to receive via email.">
      <ul className="-my-2 divide-y divide-line">
        {PREF_META.map((p) => (
          <li key={p.key} className="flex items-center justify-between gap-6 py-5">
            <div>
              <p className="text-[15px] font-medium text-ink">{p.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">{p.description}</p>
            </div>
            <Switch checked={prefs[p.key]} disabled={busy === p.key} label={`Email me about ${p.title.toLowerCase()}`} onChange={(v) => toggle(p.key, v)} />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">You'll still see every alert on the Notifications page. These switches only control email.</p>
    </SettingsCard>
  );
}