import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { MAX_ROWS, parseFile, planImport, summarise } from "@/lib/migration/historical";

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (g.error) return g.error;

  const commit = new URL(req.url).searchParams.get("mode") === "commit"; // default is a dry run
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Attach a CSV or JSON file as 'file'" }, { status: 400 });
  if (file.size > 2_000_000) return NextResponse.json({ error: "File is larger than 2 MB" }, { status: 413 });
  const createMissing = form?.get("create_missing") === "true";

  const { rows, error } = parseFile(file.name, await file.text());
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (!rows.length) return NextResponse.json({ error: "The file has no rows" }, { status: 400 });
  if (rows.length > MAX_ROWS) return NextResponse.json({ error: `Too many rows (max ${MAX_ROWS})` }, { status: 400 });

  const admin = createAdminClient();
  const { ok, ...summary } = summarise(await planImport(admin, rows, createMissing));

  if (!commit) return NextResponse.json({ mode: "dry_run", ...summary });
  if (!ok.length) return NextResponse.json({ mode: "commit", ...summary, result: { imported: 0 }, note: "Nothing to import" });

  const batch = crypto.randomUUID();
  const { data, error: rpcErr } = await admin.rpc("import_historical", {
    p_admin: g.user.id, p_batch: batch, p_rows: ok.map((p) => p.payload),
  });
  if (rpcErr)
    return NextResponse.json({ error: `Import failed and was rolled back: ${rpcErr.message}` }, { status: 500 });

  return NextResponse.json({ mode: "commit", batch_id: batch, ...summary, result: data });
}