import { NextResponse, after } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { orderBodySchema } from "@/lib/validations/order.schema";
import { rpcError } from "@/lib/utils/api";
import { notifyAmended } from "@/lib/email/orderEmails";
import { onOrderAmended } from "@/lib/notifications/events"; // adjust to where onOrderAmended lives

type Ctx = { params: Promise<{ id: string }> };

// RLS decides who can see what: a rep only gets their own order; admins get everything.
export async function GET(_: Request, { params }: Ctx) {
  const g = await requireUser();
  if (g.error) return g.error;
  const { id } = await params;

  const { data, error } = await g.supabase.from("orders").select(`
      *, quarters(name,deadline_date), organisations(name,type,contact_name,contact_email,mpesa_phone),
      order_items(category_slug,quantity,unit_price_kes),
      order_amendments(id,previous_data,new_data,payment_adjustment,amended_at),
      order_status_history(from_status,to_status,changed_at),
      mpesa_transactions(id,amount_kes,status,result_desc,mpesa_receipt_number,transaction_date,created_at,phone_number,needs_review,review_note)
    `).eq("id", id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

// Amend (rep only: the SQL function checks the order belongs to the caller's org)
export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireUser();
  if (g.error) return g.error;
  const { id } = await params;

  const parsed = orderBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await createAdminClient().rpc("amend_order", {
    p_user: g.user.id, p_order_id: id, p_items: parsed.data.quantities,
  });
  if (error) return rpcError(error);

  const r = data as { payment_adjustment: string; amount_due: number; refund_amount: number };
  await notifyAmended(id, r.payment_adjustment, r.amount_due, r.refund_amount);
  after(() => onOrderAmended(id, r.payment_adjustment, r.refund_amount));
  return NextResponse.json({ data: r });
}