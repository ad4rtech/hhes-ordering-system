import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const B = ({ children }: { children: ReactNode }) => <strong className="font-medium text-ink">{children}</strong>;

export function Topic({ id, title, first, children }: { id: string; title: string; first?: boolean; children: ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-24", !first && "border-t border-line pt-12")}>
      <h2 className="text-2xl font-bold text-ink sm:text-[28px]">{title}</h2>
      <div className="mt-5 space-y-4 text-base leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3"><Check size={18} className="mt-1 shrink-0 text-positive" aria-hidden /><span>{t}</span></li>
      ))}
    </ul>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full min-w-[560px] text-left">
        <thead className="bg-panel">
          <tr>{head.map((h) => <th key={h} className="px-5 py-3.5 text-[15px] font-semibold text-ink">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className={cn("px-5 py-4 align-top text-[15px]", j === 0 && "font-medium text-ink")}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}