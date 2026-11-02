import type { GrowthPoint } from "@/lib/rep/reportTypes";

const STEPS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

export function GrowthChart({ data }: { data: GrowthPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = STEPS.find((s) => max <= s * 3) ?? 100000;
  const top = step * 3;
  const fmt = (v: number) => (step >= 500 ? `${(v / 1000).toFixed(1)}k` : String(v));

  const W = 560, H = 270, L = 50, R = 12, T = 32, B = 36;
  const plotH = H - T - B;
  const slot = (W - L - R) / data.length;
  const bw = Math.min(76, slot * 0.62);
  const y = (v: number) => T + plotH - (v / top) * plotH;
  const base = T + plotH;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
        aria-label={`Lesson books ordered: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y(i * step)} y2={y(i * step)} className="stroke-line" strokeWidth={i === 0 ? 1.5 : 1} strokeDasharray={i === 0 ? undefined : "3 4"} />
            <text x={L - 10} y={y(i * step) + 4} textAnchor="end" className="fill-muted text-[11px]">{fmt(i * step)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = L + slot * i + (slot - bw) / 2;
          const y0 = y(d.value);
          const h = base - y0;
          const r = Math.min(6, bw / 2, h);
          return (
            <g key={d.label}>
              {h > 0 && (
                <path d={`M${x},${base} V${y0 + r} Q${x},${y0} ${x + r},${y0} H${x + bw - r} Q${x + bw},${y0} ${x + bw},${y0 + r} V${base} Z`}
                  className={d.current ? "fill-primary" : "fill-primary-softer"} />
              )}
              <text x={x + bw / 2} y={y0 - 9} textAnchor="middle" className={d.current ? "fill-primary text-[12px] font-semibold" : "fill-muted text-[12px]"}>{d.value.toLocaleString("en-KE")}</text>
              <text x={x + bw / 2} y={H - 12} textAnchor="middle" className={d.current ? "fill-ink text-[12px] font-semibold" : "fill-muted text-[12px]"}>{d.label}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}