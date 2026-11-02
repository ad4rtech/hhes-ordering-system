"use client";

import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { downloadCsv } from "@/lib/download";
import { useLiveRefresh } from "@/lib/useLiveRefresh";
import { cn } from "@/lib/cn";

const LIVE = ["orders", "mpesa_transactions"];

export function OrdersHeader({ tab, quarterId, needsReview }: { tab: "orders" | "payments"; quarterId: string; needsReview: number }) {
  const [busy, setBusy] = useState(false);
  useLiveRefresh(LIVE);

  async function exportCsv() {
    setBusy(true);
    const payments = tab === "payments";
    await downloadCsv(`/api/reports/${payments ? "payments" : "orders"}?format=csv&quarter_id=${quarterId}`,
      payments ? "admin.payment.export_empty" : "admin.report.empty");
    setBusy(false);
  }
  const href = (t: "orders" | "payments") => `/admin/orders?${new URLSearchParams({ ...(t === "payments" ? { tab: "payments" } : {}), quarter: quarterId })}`;

  return (
    <>
      <PageHeader title="Order Management" subtitle="View, filter, and process quarterly lesson book orders."
        actions={<Button variant="outline" loading={busy} onClick={exportCsv}><Download size={18} aria-hidden /> {tab === "payments" ? "Export Reconciliation" : "Export Report"}</Button>} />
      <nav className="-mt-2 mb-6 flex gap-1 border-b border-line" aria-label="Order views">
        {([["orders", "Orders"], ["payments", "M-Pesa payments"]] as const).map(([t, label]) => (
          <Link key={t} href={href(t)} aria-current={tab === t ? "page" : undefined}
            className={cn("-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-[15px] font-medium transition-colors",
              tab === t ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink")}>
            {label}
            {t === "payments" && needsReview > 0 && <span className="rounded-full bg-danger-solid px-2 py-0.5 text-xs font-semibold text-white">{needsReview}</span>}
          </Link>
        ))}
      </nav>
    </>
  );
}