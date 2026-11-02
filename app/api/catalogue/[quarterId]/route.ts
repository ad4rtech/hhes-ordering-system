import { NextResponse, after } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { catalogueUpdateSchema } from "@/lib/validations/quarter.schema";
import { checkStockAlerts } from "@/lib/notifications/events"; // adjust to where checkStockAlerts lives

type Ctx = { params: Promise<{ quarterId: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const { quarterId } = await params;
  const { data, error } = await g.supabase
    .from("catalogue_items").select("*").eq("quarter_id", quarterId).order("category_slug");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// Set prices + stock. Prices are rejected once the quarter is published (BR-07); stock stays editable.
export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const { quarterId } = await params;

  const parsed = catalogueUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: q } = await g.supabase.from("quarters").select("status").eq("id", quarterId).single();
  if (!q) return NextResponse.json({ error: "Quarter not found" }, { status: 404 });
  if (q.status === "closed")
    return NextResponse.json({ error: "Quarter is closed" }, { status: 409 });
  if (q.status === "published" && parsed.data.items.some((i) => i.price_kes !== undefined))
    return NextResponse.json({ error: "Prices are locked once a quarter is published" }, { status: 409 });

  const results = await Promise.all(parsed.data.items.map(({ category_slug, ...fields }) =>
    g.supabase.from("catalogue_items").update(fields)
      .eq("quarter_id", quarterId).eq("category_slug", category_slug)));
  const failed = results.find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 409 });

  after(() => checkStockAlerts(quarterId));
  return NextResponse.json({ ok: true });
}