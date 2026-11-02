import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Eye, Pencil, ShoppingCart } from "lucide-react";
import { getRepContext } from "@/lib/rep/context";
import { loadRepCatalogue } from "@/lib/rep/catalogue";
import { canAmend, startBlockedReason } from "@/lib/rep/rules";
import { WindowBanner } from "@/components/rep/dashboard/WindowBanner";
import { CatalogueCard } from "@/components/rep/catalogue/CatalogueCard";
import { buttonStyles } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Catalogue" };

export default async function RepCataloguePage() {
  const ctx = await getRepContext();
  if (!ctx) redirect("/login");
  const { window: w } = ctx;
  const { items, order } = await loadRepCatalogue(ctx);

  const blocked = startBlockedReason(w);
  const cta = order
    ? canAmend(order.status, w)
      ? <Link href={`/rep/order/${order.id}/edit`} className={buttonStyles()}><Pencil size={18} aria-hidden /> Edit Order</Link>
      : <Link href={`/rep/orders?order=${order.id}`} className={buttonStyles()}><Eye size={18} aria-hidden /> View My Order</Link>
    : blocked
      ? <span aria-disabled="true" title={blocked} className={`${buttonStyles()} cursor-not-allowed bg-line-strong text-white/90 hover:bg-line-strong`}><ShoppingCart size={18} aria-hidden /> Start Order</span>
      : <Link href="/rep/order/place" className={buttonStyles()}><ShoppingCart size={18} aria-hidden /> Start Order</Link>;

  return (
    <>
      <WindowBanner window={w} level="h2" />

      <div className="mt-10 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="text-3xl font-bold text-ink sm:text-[32px]">Lesson Book Catalogue</h1>
          <p className="mt-3 max-w-[680px] text-base leading-relaxed text-muted">
            Browse available lesson book categories and their pricing for the current quarter. Identical pricing applies to both Church and Institution representatives.
          </p>
        </div>
        {cta}
      </div>

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-panel text-muted"><BookOpen size={24} aria-hidden /></span>
          <h2 className="font-sans text-lg font-semibold text-ink">The catalogue isn't available yet</h2>
          <p className="max-w-md text-[15px] leading-relaxed text-muted">Prices appear here when HHES opens the next quarter. We'll email you as soon as it does.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <CatalogueCard key={item.slug} item={item} />)}
        </div>
      )}
    </>
  );
}