import { NextResponse } from "next/server";
import { requireUser, requireAdmin } from "@/lib/auth/guards";
import { createQuarterSchema } from "@/lib/validations/quarter.schema";

// RLS does the filtering: admins see all, approved reps see only the published quarter
export async function GET() {
  const g = await requireUser();
  if (g.error) return g.error;
  const { data, error } = await g.supabase.from("quarters").select("*").order("open_date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const parsed = createQuarterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Case-insensitive duplicate name check (escape % and _ so they match literally)
  const { data: dup } = await g.supabase.from("quarters").select("id")
    .ilike("name", parsed.data.name.replace(/[%_]/g, "\\$&")).maybeSingle();
  if (dup) return NextResponse.json({ error: `A quarter named ${parsed.data.name} already exists` }, { status: 409 });

  const { data, error } = await g.supabase
    .from("quarters").insert({ ...parsed.data, created_by: g.user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 }); // trigger seeded the 6 catalogue rows
}