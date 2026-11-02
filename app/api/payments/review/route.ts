import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";

const mask = (p: string) => (p.length > 7 ? `${p.slice(0, 4)}***${p.slice(-3)}` : "***");

export async function GET() {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const { data, error } = await g.supabase.from("mpesa_transactions")
    .select("id,order_id,amount_kes,phone_number,created_at,review_note,checkout_request_id,orders(reference,organisations(name))")
    .eq("needs_review", true).eq("status", "pending").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Tx = { phone_number: string } & Record<string, unknown>;
  return NextResponse.json({ data: ((data ?? []) as unknown as Tx[]).map((t) => ({ ...t, phone_number: mask(t.phone_number) })) });
}