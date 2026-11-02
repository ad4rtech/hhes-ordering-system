import "server-only";
import type { getRepContext } from "./context";

type Ctx = NonNullable<Awaited<ReturnType<typeof getRepContext>>>;

export type CatalogueCard = { slug: string; title: string; description: string; price: number; status: "available" | "low" | "out" };

// The wording shown to organisations
const COPY: [string, string, string][] = [
  ["adults_lesson", "Adults", "Standard quarterly lesson guide designed for adult Sabbath School classes and study groups."],
  ["adults_dq", "Adults Double Quarter", "Combined lesson guide covering two full quarters for continuous adult class study."],
  ["kindergarten", "Kindergarten", "Interactive and illustrated lesson guide tailored for children aged 3-5 years."],
  ["primary", "Primary", "Engaging lesson guide and activities designed for children aged 6-9 years."],
  ["cornerstone", "Cornerstone", "Youth lesson guide focusing on teen spiritual growth, relevant topics, and foundational beliefs."],
  ["realtime", "Realtime", "Young adult lesson guide with contemporary life applications and in-depth discussions."],
];

export const REP_TITLE: Record<string, string> = Object.fromEntries(COPY.map(([slug, title]) => [slug, title]));

export async function loadRepCatalogue(ctx: Ctx) {
  const { sb, window: w } = ctx;
  const [cat, ord] = await Promise.all([
    sb.from("catalogue_public").select("category_slug,price_kes,stock_status"),
    w.quarter
      ? sb.from("orders").select("id,status").eq("quarter_id", w.quarter.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const rows = new Map(((cat.data ?? []) as { category_slug: string; price_kes: number; stock_status: CatalogueCard["status"] }[]).map((r) => [r.category_slug, r]));
  const items: CatalogueCard[] = COPY.filter(([slug]) => rows.has(slug)).map(([slug, title, description]) => ({
    slug, title, description, price: Number(rows.get(slug)!.price_kes), status: rows.get(slug)!.stock_status,
  }));

  return { items, order: (ord.data ?? null) as { id: string; status: string } | null };
}