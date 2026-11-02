"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { Download, FileText, Funnel, History } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { RepStatusBadge, repStatusLabel } from "@/components/rep/StatusBadge";
import { ReportCard } from "./ReportCard";
import { saveBlob } from "@/lib/download";
import { notify } from "@/lib/notify";
import { fmtDay } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { TableRow } from "@/lib/rep/reportTypes";

const TH = "px-5 py-3.5 text-[15px] font-semibold text-ink";
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const today = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
const HEAD = ["Quarter", "Order ID", "Submission Date", "Categories Ordered", "Total Quantities", "Total (KES)", "Paid (KES)", "Status"];

export function HistoryExport({ rows, orgName }: { rows: TableRow[]; orgName: string }) {
  const [open, setOpen] = useState(false);
  const [quarter, setQuarter] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(10);
  const [busy, setBusy] = useState(false);

  const quarters = useMemo(() => [...new Map(rows.map((r) => [r.quarterId, r.quarter])).entries()], [rows]);
  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status))], [rows]);
  const shown = rows.filter((r) => (!quarter || r.quarterId === quarter) && (!status || r.status === status));
  const active = (quarter ? 1 : 0) + (status ? 1 : 0);
  const base = `order-history-${slug(orgName)}-${today()}`;

  const cells = (r: TableRow) => [r.quarter, r.reference, fmtDay(r.date), `${r.categories}/6`, r.quantity, r.total, r.paid, repStatusLabel(r.status, r.payment)];

  function exportCsv() {
    if (!shown.length) { notify("rep.reports.empty"); return; }
    const csv = "\uFEFF" + Papa.unparse({ fields: HEAD, data: shown.map(cells) });
    saveBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${base}.csv`);
  }

  async function exportPdf() {
    if (!shown.length) { notify("rep.reports.empty"); return; }
    setBusy(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const filterText = [quarter && `Quarter: ${quarters.find(([id]) => id === quarter)?.[1]}`, status && `Status: ${repStatusLabel(status)}`].filter(Boolean).join("  |  ");

      doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(17, 24, 39);
      doc.text("Order History", 40, 48);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(107, 114, 128);
      doc.text(`${orgName}  |  Generated ${fmtDay(new Date())}${filterText ? `  |  ${filterText}` : ""}`, 40, 66);

      autoTable(doc, {
        startY: 84, head: [HEAD], body: shown.map((r) => cells(r).map((c, i) => (i >= 4 && i <= 6 ? Number(c).toLocaleString("en-KE") : String(c)))),
        styles: { font: "helvetica", fontSize: 9, cellPadding: 6, textColor: [17, 24, 39] },
        headStyles: { fillColor: [10, 103, 168], textColor: 255 },
        columnStyles: { 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
        margin: { left: 40, right: 40, bottom: 44 },
        didDrawPage: () => {
          doc.setFontSize(8); doc.setTextColor(120);
          doc.text("HHES Kenya Lesson Ordering System", 40, H - 22);
          doc.text(`Page ${doc.getNumberOfPages()}`, W - 40, H - 22, { align: "right" });
        },
      });
      saveBlob(doc.output("blob"), `${base}.pdf`);
    } catch {
      notify("common.download_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ReportCard title="Order History Export" subtitle="Filter and download your past orders for institutional procurement records."
      action={
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Funnel size={18} aria-hidden /> Filter {active > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-white">{active}</span>}
          </Button>
          <Button variant="outline" loading={busy} onClick={exportPdf}><FileText size={18} aria-hidden /> Export PDF</Button>
          <Button onClick={exportCsv}><Download size={18} aria-hidden /> Export CSV</Button>
        </div>
      }>
      {open && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-field bg-panel px-4 py-3">
          <FilterSelect label="Quarter" value={quarter} onChange={(v) => { setQuarter(v); setLimit(10); }} options={[["", "All"], ...quarters.map(([id, name]) => [id, name] as const)]} />
          <FilterSelect label="Status" value={status} onChange={(v) => { setStatus(v); setLimit(10); }} options={[["", "All"], ...statuses.map((s) => [s, repStatusLabel(s)] as const)]} />
          {active > 0 && <Button variant="ghost" size="sm" onClick={() => { setQuarter(""); setStatus(""); }}>Clear</Button>}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-field border border-dashed border-line-strong px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-panel text-muted"><History size={24} aria-hidden /></span>
          <p className="text-base font-medium text-ink">No orders to report yet</p>
          <p className="max-w-sm text-[15px] text-muted">Your order history will fill in here after you place your first order.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-field border border-line">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-panel">
                <tr>{["Quarter", "Order ID", "Submission Date", "Categories Ordered", "Total Quantities", "Final Status"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-[15px] text-muted">No orders match these filters.</td></tr>
                ) : shown.slice(0, limit).map((r) => (
                  <tr key={r.id} className="hover:bg-canvas">
                    <td className="px-5 py-4 text-base font-semibold text-ink">{r.quarter}</td>
                    <td className="px-5 py-4 font-mono text-[15px]"><Link href={`/rep/orders?order=${r.id}`} className="text-muted hover:text-primary hover:underline">{r.reference}</Link></td>
                    <td className="px-5 py-4 text-[15px] text-muted">{fmtDay(r.date)}</td>
                    <td className="px-5 py-4 text-[15px] tabular-nums text-muted">{r.categories}/6</td>
                    <td className={cn("px-5 py-4 text-base font-semibold tabular-nums", r.status === "cancelled" ? "text-muted line-through" : "text-ink")}>{r.quantity.toLocaleString("en-KE")}</td>
                    <td className="px-5 py-4"><RepStatusBadge size="sm" status={r.status} payment={r.payment} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shown.length > limit && (
            <div className="mt-4 text-center"><Button variant="outline" size="sm" onClick={() => setLimit(shown.length)}>Show all {shown.length} orders</Button></div>
          )}
        </>
      )}
    </ReportCard>
  );
}