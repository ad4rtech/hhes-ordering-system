"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { downloadCsv } from "@/lib/download";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/messages";

const ITEMS: { label: string; type: string; empty: MessageKey }[] = [
  { label: "Demand summary", type: "demand", empty: "admin.report.empty" },
  { label: "All orders", type: "orders", empty: "admin.report.empty" },
  { label: "M-Pesa reconciliation", type: "payments", empty: "admin.payment.export_empty" },
  { label: "Deadline extensions log", type: "overrides", empty: "admin.report.empty" },
  { label: "Not yet ordered list", type: "not-ordered", empty: "admin.report.empty" },
];

export function ExportMenu({ quarterId }: { quarterId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  async function run(i: number) {
    setOpen(false);
    setBusy(true);
    await downloadCsv(`/api/reports/${ITEMS[i].type}?format=csv&quarter_id=${quarterId}`, ITEMS[i].empty);
    setBusy(false);
  }

  return (
    <div ref={ref} className="relative flex">
      <Button loading={busy} className="rounded-r-none" onClick={() => run(0)}>
        <Download size={18} aria-hidden /> Export Summary CSV
      </Button>
      <button type="button" aria-label="More exports" aria-haspopup="menu" aria-expanded={open} disabled={busy}
        onClick={() => setOpen((o) => !o)}
        className={cn(buttonStyles(), "rounded-l-none border-l border-white/30 px-3")}>
        <ChevronDown size={18} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-field border border-line bg-surface py-1 shadow-lg">
          {ITEMS.map((it, i) => (
            <button key={it.type} role="menuitem" type="button" onClick={() => run(i)}
              className="block w-full px-4 py-2.5 text-left text-[15px] text-ink hover:bg-canvas">
              {it.label} <span className="text-muted">(CSV)</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}