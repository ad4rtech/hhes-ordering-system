import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { listAdmins } from "@/lib/admin/team";

export async function GET() {
  const g = await requireAdmin();
  if (g.error) return g.error;
  return NextResponse.json({ data: await listAdmins() });
}