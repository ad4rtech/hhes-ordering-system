import { CalendarClock, Timer } from "lucide-react";
import { fmtDay } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { OrderWindow } from "@/lib/rep/context";

export function WindowBanner({ window: w, level: Heading = "h1" }: { window: OrderWindow; level?: "h1" | "h2" }) {
  const q = w.quarter;
  const left = w.daysLeft ?? 0;
  const closingSoon = w.state === "open" && left <= 3;

  const title = !q ? "No Order Window Is Open"
    : w.state === "upcoming" ? `${q.name} Opens Soon`
    : w.state === "passed" ? `${q.name} Order Window Has Closed`
    : closingSoon ? `${q.name} Order Window Closing Soon`
    : `${q.name} Order Window is Open`;

  const pill = w.state === "open"
    ? { text: left === 0 ? "Closes today" : `${left} ${left === 1 ? "day" : "days"} remaining`, cls: left === 0 ? "bg-danger-solid text-white" : left <= 7 ? "bg-attention text-white" : "bg-primary-soft text-primary" }
    : w.state === "upcoming" ? { text: `Opens ${fmtDay(q!.open_date)}`, cls: "bg-primary-soft text-primary" }
    : w.state === "passed" ? { text: "Deadline passed", cls: "bg-danger-solid text-white" }
    : null;

  const frame = closingSoon ? "border-2 border-attention"
    : cn("border border-l-4 border-line", w.state === "passed" ? "border-l-danger-solid" : w.state === "none" ? "border-l-line-strong" : "border-l-primary");

  return (
    <section className={cn("flex flex-wrap items-center justify-between gap-4 rounded-card bg-surface px-6 py-6 sm:px-8", frame)}>
      <div>
        <Heading className="flex items-center gap-3 font-display text-2xl font-bold text-ink sm:text-[28px]">
          <CalendarClock size={26} className={cn("shrink-0", closingSoon ? "text-attention" : w.state === "passed" ? "text-danger-solid" : "text-primary")} aria-hidden /> {title}
        </Heading>
        <p className="mt-2 text-base text-muted">
          {q ? (
            <>
              Opens: {fmtDay(q.open_date)} <span className="mx-3 text-line-strong">|</span> Deadline: {fmtDay(q.deadline_date)}
              {w.extendedTo && <span className="ml-2 font-medium text-primary">(extended to {fmtDay(w.extendedTo)})</span>}
            </>
          ) : "We'll email you when the next quarter opens."}
        </p>
      </div>
      {pill && (
        <span className={cn("inline-flex items-center gap-2 rounded-field px-5 py-3 text-base font-semibold", pill.cls)}>
          <Timer size={18} aria-hidden /> {pill.text}
        </span>
      )}
    </section>
  );
}