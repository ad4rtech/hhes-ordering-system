import { CircleCheck, CircleX, Clock } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ReportCard } from "./ReportCard";
import { fmtMonthYear } from "@/lib/utils/format";
import type { ReportsData } from "@/lib/rep/reportTypes";

export function ComplianceCard({ percent, eligible, issues }: ReportsData["compliance"]) {
  const tone: BadgeTone = percent === null ? "neutral" : percent >= 90 ? "positive" : percent >= 70 ? "attention" : "danger";
  return (
    <ReportCard title="Compliance Record" subtitle="Log of missed submission windows or late activities." className="h-full"
      action={<Badge tone={tone} className="px-4 py-2 text-sm">{percent === null ? "No history yet" : `${percent}% Compliance`}</Badge>}>
      {issues.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-field border border-dashed border-line-strong px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success"><CircleCheck size={24} aria-hidden /></span>
          <p className="text-base font-medium text-ink">{percent === null ? "Nothing to measure yet" : "No missed deadlines or late activity"}</p>
          <p className="max-w-xs text-[15px] text-muted">{percent === null ? "Your record builds up as quarters close." : "Keep it up."}</p>
        </div>
      ) : (
        <ul className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
          {issues.map((i) => (
            <li key={i.id} className="flex items-center gap-4 rounded-field border border-line px-4 py-4">
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-field ${i.tone === "danger" ? "bg-danger-soft text-danger-solid" : "bg-warning-soft text-attention"}`}>
                {i.tone === "danger" ? <CircleX size={22} aria-hidden /> : <Clock size={22} aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-ink">{i.quarter}</p>
                <p className="text-[15px] text-muted">{i.label}</p>
              </div>
              <span className="shrink-0 text-sm text-muted">{fmtMonthYear(i.at)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-5 text-sm leading-relaxed text-muted">
        A completed quarter counts as compliant when you ordered by the deadline, paid before it closed, and made no late changes. Quarters you cancelled aren't counted.
      </p>
    </ReportCard>
  );
}