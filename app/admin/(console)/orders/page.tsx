import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { loadOrderContext, loadOrders } from "@/lib/admin/orders";
import { loadPayments } from "@/lib/admin/payments";
import { PageHeader } from "@/components/admin/PageHeader";
import { OrdersHeader } from "@/components/admin/orders/OrdersHeader";
import { OrdersTab } from "@/components/admin/orders/OrdersTab";
import { PaymentsTab } from "@/components/admin/orders/PaymentsTab";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => { const v = sp[k]; return Array.isArray(v) ? v[0] : v; };
  const sb = await createClient();

  const ctx = await loadOrderContext(sb, one("quarter"));
  if (!ctx.selected) {
    return (
      <>
        <PageHeader title="Order Management" subtitle="View, filter, and process quarterly lesson book orders." />
        <div className="rounded-card border border-line bg-surface px-6 py-16 text-center">
          <h2 className="font-sans text-lg font-semibold text-ink">No orders yet</h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">Orders appear here once a quarter has been published and organisations start ordering.</p>
        </div>
      </>
    );
  }

  const tab = one("tab") === "payments" ? "payments" : "orders";
  const page = Number(one("page") ?? 1);

  return (
    <>
      <OrdersHeader tab={tab} quarterId={ctx.selected.id} needsReview={ctx.needsReview} />
      {tab === "payments" ? (
        <PaymentsTab quarters={ctx.quarters} selected={ctx.selected} status={one("status") ?? ""}
          data={await loadPayments(sb, ctx.selected.id, { status: one("status"), page })} />
      ) : (
        <OrdersTab quarters={ctx.quarters} selected={ctx.selected}
          filters={{ q: one("q") ?? "", status: one("status") ?? "", type: one("type") ?? "" }}
          openOrder={one("order")}
          data={await loadOrders(sb, ctx.selected, { q: one("q"), status: one("status"), type: one("type"), page })} />
      )}
    </>
  );
}