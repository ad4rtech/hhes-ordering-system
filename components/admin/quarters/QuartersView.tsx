"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, CalendarPlus, CirclePlus, Lock } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { CloseDialog, PublishDialog, QuarterFormDialog } from "./QuarterDialogs";
import { ExtensionDialog } from "./ExtensionDialog";
import { fmtDate, fmtDay, kes } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { ExtensionRow, QuarterRow } from "@/lib/admin/quarters";

type DialogState = { type: "create" } | { type: "edit" | "publish" | "close"; q: QuarterRow } | { type: "extend" } | null;

const STATUS: Record<QuarterRow["status"], [BadgeTone, string]> = { draft: ["neutral", "Draft"], published: ["successSoft", "Open"], closed: ["plain", "Closed"] };
const countdown = (d: number) => (d < 0 ? "Deadline passed" : d === 0 ? "Closes today" : d === 1 ? "1 day left" : `${d} days left`);
const TH = "px-6 py-4 text-[15px] font-medium text-muted";

const Tile = ({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) => (
  <div className="rounded-field border border-line bg-surface p-4">
    <dt className="text-sm text-muted">{label}</dt>
    <dd className={cn("mt-1 text-2xl font-bold text-ink", mono && "font-mono")}>{value}</dd>
  </div>
);

export function QuartersView({ quarters, extensions, approvedOrgs, extendOrgId, openNew }: {
  quarters: QuarterRow[]; extensions: ExtensionRow[]; approvedOrgs: number; extendOrgId?: string; openNew?: boolean;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(extendOrgId ? { type: "extend" } : openNew ? { type: "create" } : null);
  const [filterQ, setFilterQ] = useState("");
  const active = quarters.find((q) => q.status === "published") ?? null;
  const close = () => setDialog(null);
  const done = () => { setDialog(null); router.refresh(); };
  const shown = filterQ ? extensions.filter((e) => e.quarter_id === filterQ) : extensions;

  return (
    <>
      <PageHeader title="Quarters" subtitle="Open ordering windows, set deadlines and grant extensions."
        actions={<Button onClick={() => setDialog({ type: "create" })}><CirclePlus size={18} aria-hidden /> New Quarter</Button>} />

      {/* Active quarter */}
      <section className="overflow-hidden rounded-card border border-line bg-surface">
        {active ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 p-6">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-2xl font-bold text-ink">{active.name}</h2>
                  <Badge tone="success"><span className="mr-2 size-2 rounded-full bg-positive" aria-hidden />Open for ordering</Badge>
                </div>
                <p className="mt-2 text-[15px] text-muted">
                  Opened {fmtDate(active.open_date)} · Closes {fmtDate(active.deadline_date)} ·{" "}
                  <span className={cn("font-medium", active.days_left <= 3 ? "text-warning" : "text-ink")}>{countdown(active.days_left)}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setDialog({ type: "extend" })}><CalendarPlus size={18} aria-hidden /> Grant extension</Button>
                <Button variant="dangerOutline" onClick={() => setDialog({ type: "close", q: active })}><Lock size={16} aria-hidden /> Close quarter</Button>
              </div>
            </div>
            <dl className="grid gap-4 border-t border-line bg-chrome p-6 sm:grid-cols-2 lg:grid-cols-4">
              <Tile label="Orders" value={active.orders} />
              <Tile label="Fully paid" value={active.paid_orders} />
              <Tile label="Revenue collected" value={kes(active.revenue_kes)} mono />
              <Tile label="Organisations ordered" value={`${active.orders} of ${approvedOrgs}`} />
            </dl>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-panel text-muted"><CalendarClock size={24} aria-hidden /></span>
            <h2 className="font-sans text-lg font-semibold text-ink">No quarter is open for ordering</h2>
            <p className="max-w-md text-[15px] leading-relaxed text-muted">Create a quarter, set its prices in the catalogue, then publish it so organisations can order.</p>
            <Button onClick={() => setDialog({ type: "create" })}>New Quarter</Button>
          </div>
        )}
      </section>

      {/* All quarters */}
      <section className="mt-8 overflow-hidden rounded-card border border-line bg-surface">
        <h2 className="px-6 py-5 font-sans text-lg font-semibold text-ink">All Quarters</h2>
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-panel">
              <tr>
                <th className={TH}>Quarter</th><th className={TH}>Status</th><th className={TH}>Opens</th><th className={TH}>Deadline</th>
                <th className={TH}>Orders</th><th className={TH}>Revenue</th><th className={`${TH} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {quarters.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted">No quarters yet. Create the first one to start taking orders.</td></tr>
              ) : quarters.map((q) => {
                const [tone, label] = STATUS[q.status];
                return (
                  <tr key={q.id}>
                    <td className="px-6 py-5">
                      <p className="text-[15px] font-medium text-ink">{q.name}</p>
                      {q.status === "draft" && <p className={cn("text-sm", q.priced_categories >= 6 ? "text-success" : "text-warning")}>Prices set: {q.priced_categories} of 6</p>}
                    </td>
                    <td className="px-6 py-5"><Badge tone={tone}>{label}</Badge></td>
                    <td className="px-6 py-5 text-[15px] text-ink">{fmtDate(q.open_date)}</td>
                    <td className="px-6 py-5 text-[15px] text-ink">{fmtDate(q.deadline_date)}</td>
                    <td className="px-6 py-5 text-[15px] text-ink">{q.status === "draft" ? "-" : q.orders}</td>
                    <td className="px-6 py-5 font-mono text-[15px] text-ink">{q.status === "draft" ? "-" : kes(q.revenue_kes)}</td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        {q.status === "draft" && (<>
                          <Link href={`/admin/catalogue?quarter=${q.id}`} className={buttonStyles({ variant: "outline", size: "sm" })}>Set prices</Link>
                          <Button variant="outline" size="sm" onClick={() => setDialog({ type: "edit", q })}>Edit</Button>
                          <Button size="sm" onClick={() => setDialog({ type: "publish", q })}>Publish</Button>
                        </>)}
                        {q.status === "published" && (<>
                          <Link href={`/admin/catalogue?quarter=${q.id}`} className={buttonStyles({ variant: "outline", size: "sm" })}>Catalogue</Link>
                          <Button variant="dangerOutline" size="sm" onClick={() => setDialog({ type: "close", q })}>Close</Button>
                        </>)}
                        {q.status === "closed" && <Link href={`/admin/orders?quarter=${q.id}`} className={buttonStyles({ variant: "outline", size: "sm" })}>View orders</Link>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deadline extensions */}
      <section id="extensions" className="mt-8 scroll-mt-24 overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h2 className="font-sans text-lg font-semibold text-ink">Deadline Extensions</h2>
            <p className="mt-1 text-sm text-muted">Every extension is a permanent record. It can't be edited or deleted.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={filterQ} onChange={(e) => setFilterQ(e.target.value)} aria-label="Filter by quarter"
              className="h-10 rounded-field border border-line bg-surface px-3 text-[15px] text-ink focus:border-primary focus:outline-none">
              <option value="">All quarters</option>
              {quarters.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
            <Button variant="outline" size="sm" disabled={!active} title={active ? undefined : "No quarter is open"} onClick={() => setDialog({ type: "extend" })}>
              <CalendarPlus size={16} aria-hidden /> Grant extension
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-panel">
              <tr><th className={TH}>Organisation</th><th className={TH}>Quarter</th><th className={TH}>Deadline</th><th className={TH}>Reason</th><th className={TH}>Granted by</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted">No extensions have been granted.</td></tr>
              ) : shown.map((e) => (
                <tr key={e.id}>
                  <td className="px-6 py-5 text-[15px] font-medium text-ink">{e.organisations?.name ?? "-"}</td>
                  <td className="px-6 py-5 text-[15px] text-ink">{e.quarters?.name ?? "-"}</td>
                  <td className="px-6 py-5 text-[15px] text-ink">{fmtDate(e.original_deadline)} → <strong className="font-medium">{fmtDate(e.new_deadline)}</strong></td>
                  <td className="max-w-[320px] px-6 py-5 text-sm leading-relaxed text-muted">{e.reason}</td>
                  <td className="px-6 py-5"><p className="text-[15px] text-ink">{e.granted_by_profile?.full_name ?? "An admin"}</p><p className="text-sm text-muted">{fmtDay(e.granted_at)}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <QuarterFormDialog dialog={dialog?.type === "create" || dialog?.type === "edit" ? dialog : null}
        existingNames={quarters.map((q) => q.name)} onClose={close} onDone={done} />
      <PublishDialog q={dialog?.type === "publish" ? dialog.q : null} active={active} onClose={close} onDone={done} />
      <CloseDialog q={dialog?.type === "close" ? dialog.q : null} onClose={close} onDone={done} />
      <ExtensionDialog open={dialog?.type === "extend"} quarter={active} extensions={extensions} initialOrgId={extendOrgId} onClose={close} onDone={done} />
    </>
  );
}