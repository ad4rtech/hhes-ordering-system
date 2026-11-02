import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { stkPushSchema } from "@/lib/validations/payment.schema";
import { rpcError } from "@/lib/utils/api";
import { stkPush } from "@/lib/mpesa/daraja";

export async function POST(req: Request) {
  const g = await requireUser();
  if (g.error) return g.error;

  const parsed = stkPushSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createAdminClient();

  // The order must belong to the caller's own approved organisation
  const { data: org } = await admin.from("organisations")
    .select("id,status,mpesa_phone").eq("user_id", g.user.id).maybeSingle();
  if (!org || org.status !== "approved")
    return NextResponse.json({ error: "Only approved organisations can pay for orders" }, { status: 403 });

  const { data: order } = await admin.from("orders").select("*")
    .eq("id", parsed.data.order_id).eq("organisation_id", org.id).maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "awaiting_payment")
    return NextResponse.json({ error: `This order is ${order.status.replace("_", " ")}; no payment is due` }, { status: 409 });

  const due = Math.ceil(Number(order.total_amount_kes) - Number(order.amount_paid_kes));
  if (due < 1) return NextResponse.json({ error: "Nothing is due on this order" }, { status: 409 });

  // Payments follow the same deadline rules as ordering (including per-org overrides)
  const open = await admin.rpc("ordering_open", { p_org: org.id, p_quarter_id: order.quarter_id });
  if (open.error) return rpcError(open.error);

  // Guard against double-taps while a prompt is still open on the phone
  const since = new Date(Date.now() - 90_000).toISOString();
  const { data: recent } = await admin.from("mpesa_transactions").select("id")
    .eq("order_id", order.id).eq("status", "pending").gte("created_at", since).limit(1);
  if (recent?.length)
    return NextResponse.json({ error: "A payment prompt was just sent. Check your phone, or wait a minute before retrying." }, { status: 429 });

  const phone = parsed.data.phone || org.mpesa_phone;
  if (!phone) return NextResponse.json({ error: "Enter the M-Pesa number to pay with" }, { status: 400 });

  try {
    const r = await stkPush({
      phone, amount: due,
      accountReference: `HHES${String(order.reference).slice(5)}`, // 12 chars max
      description: "Lesson order",
    });

    const { error } = await admin.from("mpesa_transactions").insert({
      order_id: order.id,
      checkout_request_id: r.checkoutRequestId,
      merchant_request_id: r.merchantRequestId,
      phone_number: phone,
      amount_kes: due,
      status: "pending",
    });
    // If this ever fires, a prompt was sent but isn't tracked: reconcile from the Safaricom statement
    if (error) console.error("[stkpush] UNTRACKED PROMPT", r.checkoutRequestId, error.message);

    // First payment saves the number automatically; later ones only when "save" is ticked
    if (!org.mpesa_phone || parsed.data.save_phone) {
      const { error: saveErr } = await admin.from("organisations")
        .update({ mpesa_phone: phone })
        .eq("id", org.id);
      if (saveErr) console.error("[stkpush] could not save phone:", saveErr.message);
    }

    return NextResponse.json({
      ok: true, checkout_request_id: r.checkoutRequestId, amount: due,
      message: r.customerMessage ?? "Check your phone and enter your M-Pesa PIN.",
    }, { status: 201 });
  } catch (e) {
    console.error("[stkpush] failed:", e);
    return NextResponse.json({ error: "Could not reach M-Pesa. Please try again in a moment." }, { status: 502 });
  }
}