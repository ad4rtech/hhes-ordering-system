import { NextResponse, after } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { statusActionSchema } from "@/lib/validations/order.schema";
import { notifyReady, notifyCollected } from "@/lib/email/orderEmails";
import { notifyOrg } from "@/lib/notifications/rep";
import { kes } from "@/lib/utils/format";

const NEXT: Record<string, string> = { paid: "ready_for_pickup", ready_for_pickup: "collected" };

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (g.error) return g.error;
  const { id } = await params;

  const parsed = statusActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;

  const { data: order } = await g.supabase.from("orders").select("*").eq("id", id).single();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Admin confirms finance refunded the org manually (v1 has no automated refunds)
  if ("action" in body) {
    if (!order.refund_due)
      return NextResponse.json({ error: "No refund is pending on this order" }, { status: 409 });
    const { error } = await g.supabase.from("orders").update({
      refund_due: false, refund_amount_kes: 0,
      amount_paid_kes: Number(order.amount_paid_kes) - Number(order.refund_amount_kes),
    }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    after(() => notifyOrg(order.organisation_id, {
      type: "refund_processed", dedupeKey: `refund_processed:${id}:${order.refund_amount_kes}`,
      title: "Refund processed", link: `/rep/orders?order=${id}`, actionLabel: "View order",
      body: `HHES finance has refunded **${kes(Number(order.refund_amount_kes))}** for order ${order.reference}.`,
    }));
    return NextResponse.json({ ok: true });
  }

  // BR-10 in the API. The database trigger enforces the same rule as a second layer.
  if (NEXT[order.status] !== body.status || order.payment_status !== "paid") {
    return NextResponse.json({
      error: order.payment_status !== "paid"
        ? "This order has not been fully paid, so it cannot move forward"
        : `Cannot move an order from ${order.status} to ${body.status}`,
    }, { status: 409 });
  }

  const patch = body.status === "collected"
    ? { status: "collected", collected_at: new Date().toISOString(), collected_by: g.user.id }
    : { status: body.status };

  const { error } = await g.supabase.from("orders").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });

  if (body.status === "ready_for_pickup") await notifyReady(id);
  else await notifyCollected(id);
  return NextResponse.json({ ok: true, status: body.status });
}