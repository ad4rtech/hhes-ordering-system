import { NextResponse, after } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { rpcError } from "@/lib/utils/api";
import { notifyCancelled } from "@/lib/email/orderEmails";
import { onOrderCancelled } from "@/lib/notifications/events"; // adjust to where onOrderCancelled lives

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireUser();
  if (g.error) return g.error;
  const { id } = await params;

  const { data, error } = await createAdminClient().rpc("cancel_order", {
    p_user: g.user.id, p_order_id: id,
  });
  if (error) return rpcError(error);

  const r = data as { refund_due: boolean; refund_amount: number };
  await notifyCancelled(id, r.refund_amount);
  after(() => onOrderCancelled(id, r.refund_amount));
  return NextResponse.json({ data: r });
}