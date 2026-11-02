import { CircleCheck, CircleX, TriangleAlert, type LucideIcon } from "lucide-react";
import { CategoryImage } from "./CategoryImage";
import { kes } from "@/lib/utils/format";
import { cn } from "@/lib/cn";
import type { CatalogueCard as Card } from "@/lib/rep/catalogue";

const STATUS: Record<Card["status"], { label: string; icon: LucideIcon; cls: string }> = {
  available: { label: "Available", icon: CircleCheck, cls: "bg-positive text-white" },
  low: { label: "Low Stock", icon: TriangleAlert, cls: "bg-attention text-white" },
  out: { label: "Out of Stock", icon: CircleX, cls: "bg-danger-solid text-white" },
};

export function CatalogueCard({ item }: { item: Card }) {
  const s = STATUS[item.status];
  const Icon = s.icon;
  const out = item.status === "out";
  const [currency, amount] = kes(item.price).split(" ");

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface">
      <div className="relative aspect-[4/3] overflow-hidden bg-panel">
        <CategoryImage slug={item.slug} alt={`${item.title} lesson guide`} muted={out} />
        <span className={cn("absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold shadow-sm", s.cls)}>
          <Icon size={15} aria-hidden /> {s.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-7">
        <h2 className="font-sans text-xl font-semibold text-ink">{item.title}</h2>
        <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted">{item.description}</p>
        <div className="mt-6 border-t border-line pt-5">
          <p className={cn("font-mono", out ? "text-muted" : "text-ink")}>
            <span className="text-2xl font-bold">{currency} {amount}</span>
            <span className="ml-1.5 font-sans text-[15px] text-muted">/ unit</span>
          </p>
        </div>
      </div>
    </article>
  );
}