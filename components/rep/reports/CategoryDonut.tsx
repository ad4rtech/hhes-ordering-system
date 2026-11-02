import type { Share } from "@/lib/rep/reportTypes";

const STROKE = ["stroke-primary", "stroke-ink", "stroke-positive", "stroke-attention", "stroke-danger-solid", "stroke-muted"];
const SWATCH = ["bg-primary", "bg-ink", "bg-positive", "bg-attention", "bg-danger-solid", "bg-muted"];

export function CategoryDonut({ total, shares }: { total: number; shares: Share[] }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  let used = 0;

  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
      <div className="relative size-[210px] shrink-0">
        <svg viewBox="0 0 200 200" className="size-full -rotate-90" role="img"
          aria-label={`Share of ${total} books: ${shares.map((s) => `${s.name} ${s.pct}%`).join(", ")}`}>
          <circle cx="100" cy="100" r={r} fill="none" strokeWidth="28" className="stroke-canvas" />
          {shares.map((s, i) => {
            const len = (s.qty / total) * c;
            const el = <circle key={s.slug} cx="100" cy="100" r={r} fill="none" strokeWidth="28" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-used} className={STROKE[i % STROKE.length]} />;
            used += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold text-ink">{total.toLocaleString("en-KE")}</span>
          <span className="text-sm text-muted">Total Books</span>
        </div>
      </div>
      <ul className="min-w-[200px] flex-1 space-y-3.5">
        {shares.map((s, i) => (
          <li key={s.slug} className="flex items-center justify-between gap-4 text-[15px]">
            <span className="flex items-center gap-3 text-ink"><span className={`size-3 rounded-[3px] ${SWATCH[i % SWATCH.length]}`} aria-hidden /> {s.name}</span>
            <span className="font-semibold tabular-nums text-ink">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}