import { ChevronDown } from "lucide-react";
import { repStatusLabel } from "@/components/rep/StatusBadge";
import { CATEGORIES } from "@/lib/admin/catalogue";
import { kes } from "@/lib/utils/format";
import type { DOrder } from "@/lib/rep/dashboard";

const NAME = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

export function PastQuarter({ order }: { order: DOrder }) {
  const items = order.order_items.filter((i) => i.quantity > 0);
  const units = items.reduce((n, i) => n + i.quantity, 0);
  return (
    <details className="group rounded-card border border-dashed border-line-strong bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-6 sm:px-8 [&::-webkit-details-marker]:hidden">
        <div>
          <h2 className="font-sans text-lg font-semibold text-ink">Past Quarter Summary ({order.quarters?.name ?? "Earlier quarter"})</h2>
          <p className="mt-1 text-[15px] text-muted">Total Items: {units.toLocaleString("en-KE")} • Status: {repStatusLabel(order.status, order.payment_status)}</p>
        </div>
        <ChevronDown size={20} className="shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-line px-6 pb-6 pt-5 sm:px-8">
        <div className="overflow-hidden rounded-field border border-line">
          <table className="w-full text-left">
            <tbody className="divide-y divide-line">
              {items.map((i) => (
                <tr key={i.category_slug}>
                  <td className="px-5 py-3.5 text-[15px] text-ink">{NAME[i.category_slug] ?? i.category_slug}</td>
                  <td className="px-5 py-3.5 text-right text-[15px] tabular-nums text-ink">{i.quantity.toLocaleString("en-KE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">Order <span className="font-mono text-ink">{order.reference}</span> · Total <span className="font-mono text-ink">{kes(order.total_amount_kes)}</span></p>
      </div>
    </details>
  );
}