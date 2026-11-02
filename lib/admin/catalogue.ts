import type { SupabaseClient } from "@supabase/supabase-js";
import { Backpack, Book, BookCopy, LibraryBig, Smile, Users, type LucideIcon } from "lucide-react";

export const CATEGORIES: { slug: string; name: string; short: string; blurb: string; icon: LucideIcon }[] = [
  { slug: "adults_lesson", name: "Adults Lesson", short: "Adults Lesson", blurb: "Standard quarterly adult guide", icon: Book },
  { slug: "adults_dq", name: "Adults Double Quarter", short: "Adults Double Q", blurb: "Extended 6-month edition", icon: BookCopy },
  { slug: "kindergarten", name: "Kindergarten", short: "Kindergarten", blurb: "Ages 0-4 guide", icon: Smile },
  { slug: "primary", name: "Primary", short: "Primary", blurb: "Ages 5-9 guide", icon: Backpack },
  { slug: "cornerstone", name: "Cornerstone", short: "Cornerstone", blurb: "Early teens guide", icon: LibraryBig },
  { slug: "realtime", name: "Realtime", short: "Realtime", blurb: "Young adults guide", icon: Users },
];

export type CatQuarter = { id: string; name: string; status: "draft" | "published" | "closed"; open_date: string };
export type CatItem = { slug: string; price: number; stock: number };
export type CatalogueData = {
  quarters: CatQuarter[];
  selected: CatQuarter | null;
  items: CatItem[];
  reference: { quarter: CatQuarter; prices: Record<string, number> } | null;
};

export async function loadCatalogue(sb: SupabaseClient, quarterId?: string): Promise<CatalogueData> {
  const [qs, rows] = await Promise.all([
    sb.from("quarters").select("id,name,status,open_date").order("open_date", { ascending: false }),
    sb.from("catalogue_items").select("quarter_id,category_slug,price_kes,stock_quantity"),
  ]);
  if (qs.error) throw new Error(qs.error.message);
  const quarters = (qs.data ?? []) as CatQuarter[];
  if (!quarters.length) return { quarters, selected: null, items: [], reference: null };

  const cells = new Map<string, { price: number; stock: number }>();
  for (const r of (rows.data ?? []) as { quarter_id: string; category_slug: string; price_kes: number; stock_quantity: number }[])
    cells.set(`${r.quarter_id}|${r.category_slug}`, { price: Number(r.price_kes), stock: Number(r.stock_quantity) });
  const itemsFor = (id: string): CatItem[] =>
    CATEGORIES.map((c) => ({ slug: c.slug, price: cells.get(`${id}|${c.slug}`)?.price ?? 0, stock: cells.get(`${id}|${c.slug}`)?.stock ?? 0 }));

  const selected =
    quarters.find((q) => q.id === quarterId) ??
    quarters.find((q) => q.status === "published") ??
    quarters.find((q) => q.status === "draft") ??
    quarters[0];

  // Reference: the open quarter first, then the most recent others, whichever has prices
  const others = quarters.filter((q) => q.id !== selected.id);
  const candidates = [...others.filter((q) => q.status === "published"), ...others.filter((q) => q.status !== "published")];
  let reference: CatalogueData["reference"] = null;
  for (const q of candidates) {
    const items = itemsFor(q.id);
    if (items.some((i) => i.price > 0)) {
      reference = { quarter: q, prices: Object.fromEntries(items.map((i) => [i.slug, i.price])) };
      break;
    }
  }
  return { quarters, selected, items: itemsFor(selected.id), reference };
}