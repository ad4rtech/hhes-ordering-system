"use client";

import { useEffect, useState } from "react";
import { PersonalCard } from "./PersonalCard";
import { SecurityCard } from "./SecurityCard";
import { PrefsCard } from "./PrefsCard";
import { AdminTeamCard } from "./AdminTeamCard";
import { ImportCard } from "./ImportCard";
import { cn } from "@/lib/cn";
import type { Prefs } from "@/lib/notifications/types";
import type { AdminMember } from "@/lib/admin/team";

const SECTIONS = [
  { id: "personal", label: "Personal Information" },
  { id: "security", label: "Security & Password" },
  { id: "notifications", label: "Notification Preferences" },
  { id: "team", label: "Admin Team" },
  { id: "import", label: "Data Import" },
];

function useActive() {
  const [active, setActive] = useState(SECTIONS[0].id);
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) setActive(top.target.id);
    }, { rootMargin: "-20% 0px -60% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return [active, setActive] as const;
}

export function ProfileView(p: {
  userId: string; email: string; pendingEmail: string | null; firstName: string; lastName: string;
  avatarUrl: string | null; prefs: Prefs; admins: AdminMember[];
}) {
  const [active, setActive] = useActive();
  return (
    <div className="mx-auto max-w-[1000px]">
      <h1 className="text-3xl font-bold text-ink sm:text-[32px]">Profile Settings</h1>
      <p className="mt-2 text-base text-muted">Manage your administrative account details and preferences.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <nav aria-label="Profile sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} onClick={() => setActive(s.id)} aria-current={active === s.id ? "true" : undefined}
                  className={cn("block rounded-field px-4 py-3 text-[15px] transition-colors", active === s.id ? "border border-line bg-surface font-medium text-ink" : "border border-transparent text-muted hover:text-ink")}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-8">
          <PersonalCard userId={p.userId} email={p.email} pendingEmail={p.pendingEmail} firstName={p.firstName} lastName={p.lastName} avatarUrl={p.avatarUrl} />
          <SecurityCard email={p.email} name={`${p.firstName} ${p.lastName}`.trim()} />
          <PrefsCard initial={p.prefs} />
          <AdminTeamCard admins={p.admins} currentId={p.userId} />
          <ImportCard />
        </div>
      </div>
    </div>
  );
}