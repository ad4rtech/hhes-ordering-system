import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { listOrganisations } from "@/lib/admin/organisations";

export async function GET(req: Request) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const sp = new URL(req.url).searchParams;

  try {
    const r = await listOrganisations(g.supabase, {
      q: sp.get("q") ?? undefined, status: sp.get("status") ?? undefined, type: sp.get("type") ?? undefined,
      exclude: sp.get("exclude") ?? undefined, page: Number(sp.get("page") ?? 1), pageSize: Number(sp.get("page_size") ?? 10),
    });
    return NextResponse.json({ data: r.rows, count: r.count, page: r.page, page_size: r.pageSize });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}