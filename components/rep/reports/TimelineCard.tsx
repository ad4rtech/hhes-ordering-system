"use client";

import Papa from "papaparse";
import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ReportCard } from "./ReportCard";
import { saveBlob } from "@/lib/download";
import { fmtStamp } from "@/lib/utils/format";
import type { ReportsData, TimelineKind } from "@/lib/rep/reportTypes";

const DOT: Record<TimelineKind, string> = {
  collected: "bg-positive", ready: "bg-primary", paid: "bg-success", amended: "bg-attention",
  payment_failed: "bg-danger-solid", cancelled: "bg-danger-solid", imported: "bg-muted",
  submitted: "border-2 border-subtle bg-surface",
};

export function TimelineCard({ data }: { data: ReportsData["timeline"] }) {
  function download() {
    if (!data) return;
    const csv = "\uFEFF" + Papa.unparse({
      fields: ["Date and time", "Event", "Details"],
      data: data.events.map((e) => [fmtStamp(e.at), e.title, e.body]),
    });
    saveBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `order-log-${data.reference}.csv`);
  }

  return (
    <ReportCard title="Order Timeline (Audit Trail)"
      subtitle={data ? `Chronological view of all actions taken on your most recent ${data.quarter} order.` : "Chronological view of all actions taken on your most recent order."}
      action={<Button variant="outline" disabled={!data} onClick={download}><Download size={18} aria-hidden /> Download Log</Button>}>
      {!data ? (
        <p className="rounded-field border border-dashed border-line-strong px-6 py-10 text-center text-[15px] text-muted">Every action on your order will be logged here once you place one.</p>
      ) : (
        <ol className="relative ml-2 space-y-8 border-l border-line pb-1">
          {data.events.map((e) => (
            <li key={e.id} className="relative pl-8">
              <span className={`absolute -left-[7.5px] top-1.5 size-3.5 rounded-full ring-4 ring-surface ${DOT[e.kind]}`} aria-hidden />
              <h3 className="font-sans text-lg font-semibold text-ink">{e.title}</h3>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">{e.body}</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted" suppressHydrationWarning><Calendar size={15} aria-hidden /> {fmtStamp(e.at)}</p>
            </li>
          ))}
        </ol>
      )}
    </ReportCard>
  );
}