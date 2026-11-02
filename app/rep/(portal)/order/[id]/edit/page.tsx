import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getRepContext } from "@/lib/rep/context";
import { loadOrderForm } from "@/lib/rep/ordering";
import { OrderIntro } from "@/components/rep/order/OrderIntro";
import { OrderForm } from "@/components/rep/order/OrderForm";
import { Blocked } from "@/components/rep/order/Blocked";

export const metadata: Metadata = { title: "Edit Order" };

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getRepContext();
  if (!ctx) redirect("/login");
  const { id } = await params;
  const { window: w, org } = ctx;
  const data = await loadOrderForm(ctx, id);
  if (data.kind === "missing") notFound();

  return (
    <>
      <h1 className="text-3xl font-bold text-ink sm:text-[32px]">Edit Your Order</h1>
      <p className="mt-3 max-w-[760px] text-base leading-relaxed text-muted">
        Change quantities before the deadline or until your order is ready for pickup. If you've already paid, any difference is settled for you: pay the extra, or HHES finance refunds the rest.
      </p>

      {data.kind !== "ready" ? (
        <Blocked title="This order can't be changed" body="Orders can only be edited while the quarter is open and before they're marked ready for pickup. Contact HHES if you need help." />
      ) : (
        <div className="mt-8 space-y-6">
          <OrderIntro org={org} />
          <OrderForm mode="edit" orderId={id} lines={data.lines} orgType={org.type} quarterName={w.quarter!.name} deadline={w.deadline!}
            current={{ reference: data.order!.reference, total: data.order!.total, paid: data.order!.paid }} />
        </div>
      )}
    </>
  );
}