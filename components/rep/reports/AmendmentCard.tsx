import { Lightbulb } from "lucide-react";
import { ReportCard } from "./ReportCard";

export function AmendmentCard({ average }: { average: number | null }) {
  let sentence: React.ReactNode = null;
  let tip = "";

  if (average !== null) {
    if (average === 0) sentence = <>You rarely change your orders after submitting them.</>;
    else if (average < 1) sentence = <>You usually get your order right the first time, with the <strong className="font-semibold text-ink">occasional</strong> change.</>;
    else {
      const lo = Math.floor(average), hi = Math.ceil(average);
      sentence = lo === hi
        ? <>You tend to adjust your initial quantities about <strong className="font-semibold text-ink">{lo} {lo === 1 ? "time" : "times"}</strong> before the quarterly deadline closes.</>
        : <>You tend to adjust your initial quantities <strong className="font-semibold text-ink">{lo} to {hi} times</strong> before the quarterly deadline closes.</>;
    }
    tip = average >= 2
      ? "Submitting your initial order closer to the deadline might reduce the need for frequent adjustments as your numbers settle."
      : "Your orders are usually accurate the first time. Keep confirming your numbers before you submit.";
  }

  return (
    <ReportCard title="Amendment Frequency" subtitle="Insights into how often you modify your submitted orders." className="h-full">
      {average === null ? (
        <p className="rounded-field border border-dashed border-line-strong px-6 py-10 text-center text-[15px] text-muted">Place an order to see how often you adjust it.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-[minmax(0,220px)_1fr]">
          <div className="flex flex-col items-center justify-center rounded-field bg-panel px-5 py-8 text-center">
            <p className="font-display text-5xl font-bold text-ink">{average.toFixed(1)}</p>
            <p className="mt-3 text-[15px] text-muted">Average amendments per quarter</p>
          </div>
          <div>
            <p className="text-lg leading-relaxed text-muted">{sentence}</p>
            <div className="mt-5 flex gap-3 rounded-field border-l-4 border-primary bg-panel px-5 py-4">
              <Lightbulb size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <p className="text-[15px] leading-relaxed text-muted"><strong className="font-semibold text-ink">Insight:</strong> {tip}</p>
            </div>
          </div>
        </div>
      )}
    </ReportCard>
  );
}