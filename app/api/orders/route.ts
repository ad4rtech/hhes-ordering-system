import { NextResponse, after } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { orderBodySchema } from "@/lib/validations/order.schema";
import { rpcError } from "@/lib/utils/api";
import { notifySubmitted } from "@/lib/email/orderEmails";
import { onOrderPlaced } from "@/lib/notifications/events"; // adjust to where onOrderPlaced lives

// Admin: all orders (defaults to the active quarter). Rep: own orders only (RLS).
export async function GET(req: Request) {
  const g = await requireUser();
  if (g.error) return g.error;
  const sp = new URL(req.url).searchParams;

  const { data: me } = await g.supabase.from("profiles").select("role").eq("id", g.user.id).single();
  const isAdmin = me?.role === "admin";

  const orgType = sp.get("type");
  let q = g.supabase.from("orders")
    .select(`*, quarters(name), organisations${orgType ? "!inner" : ""}(name,type), order_items(category_slug,quantity)`)
    .order("created_at", { ascending: false });

  const status = sp.get("status"), pay = sp.get("payment_status");
  if (status) q = q.eq("status", status);
  if (pay) q = q.eq("payment_status", pay);
  if (orgType) q = q.eq("organisations.type", orgType);

  let quarterId = sp.get("quarter_id");
  if (isAdmin && !quarterId) {
    const { data: active } = await g.supabase.from("quarters").select("id").eq("status", "published").maybeSingle();
    quarterId = active?.id ?? null;
  }
  if (quarterId && quarterId !== "all") q = q.eq("quarter_id", quarterId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// Place an order, then the client goes straight to /rep/order/[id]/pay
export async function POST(req: Request) {
  const g = await requireUser();
  if (g.error) return g.error;

  const parsed = orderBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createAdminClient();
  const { data: orderId, error } = await admin.rpc("place_order", {
    p_user: g.user.id, p_items: parsed.data.quantities,
  });
  if (error) return rpcError(error);

  const { data: order } = await admin.from("orders")
    .select("id,reference,status,total_amount_kes").eq("id", orderId).single();
  await notifySubmitted(orderId as string);
  after(() => onOrderPlaced(orderId as string));

  return NextResponse.json({ data: order, next: `/rep/order/${orderId}/pay` }, { status: 201 });
}