import { NextResponse } from "next/server";
import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { csvResponse } from "@/lib/reports/csv";
import {
  resolveQuarter, buildDemand, buildNotOrdered, buildPayments,
  buildOrdersExport, buildOverrides, buildDashboard, buildMyReport,
} from "@/lib/reports/data";

const BUILDERS = {
  demand: buildDemand,
  "not-ordered": buildNotOrdered,
  payments: buildPayments,
  orders: buildOrdersExport,
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const sp = new URL(req.url).searchParams;
  const csv = sp.get("format") === "csv";

  // Org reps: their own data only (RLS enforces it)
  if (type === "my") {
    const g = await requireUser();
    if (g.error) return g.error;
    const r = await buildMyReport(g.supabase);
    return csv ? csvResponse(r.history, "my-orders.csv") : NextResponse.json({ data: r });
  }

  const g = await requireAdmin();
  if (g.error) return g.error;

  if (type === "overrides") {
    const report = await buildOverrides(g.supabase, sp.get("quarter_id"));
    return csv ? csvResponse(report, "override-audit-log.csv") : NextResponse.json({ data: report });
  }

  const quarter = await resolveQuarter(g.supabase, sp.get("quarter_id"));
  if (!quarter) return NextResponse.json({ error: "No quarter found" }, { status: 404 });

  if (type === "dashboard") return NextResponse.json({ data: await buildDashboard(g.supabase, quarter) });

  if (!Object.hasOwn(BUILDERS, type))
    return NextResponse.json({ error: "Unknown report type" }, { status: 404 });
  const report = await BUILDERS[type as keyof typeof BUILDERS](g.supabase, quarter, sp);

  return csv
    ? csvResponse(report, `${type}-${slug(quarter.name)}.csv`)
    : NextResponse.json({ data: report, quarter });
}