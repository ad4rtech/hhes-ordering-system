"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AccessSwitch } from "./AccessSwitch";
import { OrganisationPanel } from "./OrganisationPanel";
import { OrgStatusBadge, TypeBadge } from "./StatusBadges";
import { fmtMonthYear } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { OrgRow } from "@/lib/admin/organisations";

const STATUS_OPTIONS = [["", "All Statuses"], ["approved", "Active"], ["inactive", "Inactive"], ["rejected", "Rejected"]] as const;
const TYPE_OPTIONS = [["", "All Types"], ["church", "Church"], ["university", "University"], ["school", "School"]] as const;
const TH = "px-6 py-4 text-[15px] font-medium text-muted";

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="relative flex h-11 items-center gap-2 rounded-field border border-line bg-surface pl-3.5 pr-9 text-[15px] focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
      <span className="text-muted">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="cursor-pointer appearance-none bg-transparent font-medium text-ink focus:outline-none">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 text-muted" aria-hidden />
    </label>
  );
}

export function OrganisationsList({ rows, count, page, pageSize, filters }: {
  rows: OrgRow[]; count: number; page: number; pageSize: number; filters: { q: string; status: string; type: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q);
  const [openId, setOpenId] = useState<string | null>(null);

  function update(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) { if (v) sp.set(k, v); else sp.delete(k); }
    const qs = sp.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  }
  const refresh = () => startTransition(() => router.refresh());

  // Search as you type, after a short pause
  useEffect(() => {
    if (q.trim() === filters.q) return;
    const t = setTimeout(() => update({ q: q.trim() || undefined, page: undefined }), 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const from = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);
  const filtered = !!(filters.q || filters.status || filters.type);

  const access = (o: OrgRow): ReactNode =>
    o.status === "rejected" ? <span className="text-muted">No Access</span>
    : !o.has_login ? <span className="text-muted">No login yet</span>
    : <AccessSwitch org={o} onChanged={refresh} />;

  return (
    <section className="mt-8 overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-4 p-6">
        <div className="relative min-w-[240px] flex-1">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search organisations by name or email..."
            aria-label="Search organisations"
            className="h-11 w-full rounded-field border border-line bg-surface pl-11 pr-3.5 text-[15px] text-ink placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15" />
        </div>
        <FilterSelect label="Status" value={filters.status} options={STATUS_OPTIONS} onChange={(v) => update({ status: v || undefined, page: undefined })} />
        <FilterSelect label="Org Type" value={filters.type} options={TYPE_OPTIONS} onChange={(v) => update({ type: v || undefined, page: undefined })} />
      </div>

      <div className={cn("overflow-x-auto border-t border-line transition-opacity", isPending && "opacity-60")}>
        <table className="w-full min-w-[820px] text-left">
          <thead className="bg-panel">
            <tr>
              <th className={TH}>Organisation</th><th className={TH}>Type</th><th className={TH}>Contact Detail</th>
              <th className={TH}>Status</th><th className={TH}>System Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-14 text-center text-muted">
                  {filtered ? "No organisations match your filters." : "No organisations yet."}
                  {filtered && (
                    <div className="mt-4">
                      <Button variant="outline" size="sm" onClick={() => { setQ(""); update({ q: undefined, status: undefined, type: undefined, page: undefined }); }}>Clear filters</Button>
                    </div>
                  )}
                </td>
              </tr>
            ) : rows.map((o) => (
              <tr key={o.id} tabIndex={0} onClick={() => setOpenId(o.id)}
                onKeyDown={(e) => { if (e.key === "Enter") setOpenId(o.id); }}
                className={cn("cursor-pointer hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none", o.status !== "approved" && "bg-panel/50")}>
                <td className="px-6 py-5">
                  <p className="text-[15px] font-medium text-ink">{o.name}</p>
                  <p className="text-sm text-muted">{o.status === "rejected" ? "Applied" : "Joined"} {fmtMonthYear(o.status === "rejected" ? o.created_at : o.approved_at ?? o.created_at)}</p>
                </td>
                <td className="px-6 py-5"><TypeBadge type={o.type} /></td>
                <td className="px-6 py-5">
                  <p className="text-[15px] font-medium text-ink">{o.contact_name}</p>
                  <p className="text-sm text-muted">{o.contact_email}</p>
                </td>
                <td className="px-6 py-5"><OrgStatusBadge status={o.status} /></td>
                <td className="px-6 py-5 text-[15px]">{access(o)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-4">
        <p className="text-[15px] text-muted">Showing {from}-{to} of {count.toLocaleString("en-KE")} organisations</p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => update({ page: String(page - 1) })}>Previous</Button>
          <Button variant="outline" size="sm" disabled={to >= count || isPending} onClick={() => update({ page: String(page + 1) })}>Next</Button>
        </div>
      </div>

      <OrganisationPanel orgId={openId} onClose={() => setOpenId(null)} onChanged={refresh} />
    </section>
  );
}