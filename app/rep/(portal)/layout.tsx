import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { getRepContext, type OrderWindow } from "@/lib/rep/context";
import { RepTopbar, type QuarterPill } from "@/components/layout/RepTopbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { fmtDate, fmtDayMonth } from "@/lib/utils/format";
import { REP_WIDTH } from "@/lib/rep/layout";

export const metadata: Metadata = { robots: { index: false, follow: false } };


function pillFor(w: OrderWindow): QuarterPill {
  if (!w.quarter) return { text: "No open quarter", tone: "none" };
  if (w.state === "upcoming") return { text: `${w.quarter.name} — Opens ${fmtDayMonth(w.quarter.open_date)}`, tone: "upcoming" };
  if (w.state === "passed") return { text: `${w.quarter.name} — Deadline passed`, tone: "late" };
  return { text: `${w.quarter.name} — Open`, tone: "open" };
}

function infoFor(w: OrderWindow) {
  const q = w.quarter;
  if (!q) return "No quarter is open for ordering right now. We'll email you when the next one opens.";
  if (w.state === "upcoming") return `Ordering for ${q.name} opens on ${fmtDate(q.open_date)}.`;
  if (w.state === "passed") return `Ordering for ${q.name} closed on ${fmtDate(w.deadline!)}. Contact HHES if you need an exception.`;
  if (w.extendedTo) return `Your order deadline for ${q.name} has been extended to ${fmtDate(w.extendedTo)}.`;
  return `Current Quarter Info: ${q.name} order deadline is ${fmtDate(q.deadline_date)}.`;
}

export default async function RepLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getRepContext();
  if (!ctx) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <RepTopbar orgName={ctx.org.name} contactName={ctx.org.contact_name} avatarUrl={ctx.avatarUrl}
        userId={ctx.user.id} unread={ctx.unread} pill={pillFor(ctx.window)} />
      <main className={`${REP_WIDTH} flex-1 py-10`}>{children}</main>
      <div className="border-t border-line bg-panel">
        <p className={`${REP_WIDTH} flex items-center justify-center gap-3 py-4 text-center text-[15px] text-ink`}>
          <Info size={18} className="shrink-0 text-muted" aria-hidden /> {infoFor(ctx.window)}
        </p>
      </div>
      <PublicFooter variant="rep" containerClass={REP_WIDTH} />
    </div>
  );
}