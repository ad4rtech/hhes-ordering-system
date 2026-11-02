import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";

export async function GET() {
  const g = await requireUser();
  if (g.error) return g.error;
  const { data, error } = await g.supabase
    .from("catalogue_public").select("*").order("category_slug");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}