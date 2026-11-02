import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { sweepTransactions } from "@/lib/mpesa/sweep";

const schema = z.object({ order_id: z.string().uuid() });

export async function POST(req: Request) {
  const g = await requireUser();
  if (g.error) return g.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const id = parsed.data.order_id;

  // RLS: a rep can only see their own orders, so this doubles as the ownership check
  const { data: order } = await g.supabase.from("orders").select("id").eq("id", id).maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const sweep = await sweepTransactions({ orderId: id, minAgeMs: 120_000, limit: 5 });
  const { data: fresh } = await g.supabase.from("orders")
    .select("status,payment_status,amount_paid_kes,total_amount_kes").eq("id", id).single();
  return NextResponse.json({ data: { sweep, order: fresh } });
}