import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRepContext } from "@/lib/rep/context";
import { loadOrderForm } from "@/lib/rep/ordering";
import { WindowBanner } from "@/components/rep/dashboard/WindowBanner";
import { OrderIntro } from "@/components/rep/order/OrderIntro";
import { OrderForm } from "@/components/rep/order/OrderForm";
import { Blocked } from "@/components/rep/order/Blocked";

export const metadata: Metadata = { title: "Place Order" };

export default async function PlaceOrderPage() {
  const ctx = await getRepContext();
  if (!ctx) redirect("/login");
  const { window: w, org } = ctx;
  const data = await loadOrderForm(ctx);

  if (data.kind === "existing") redirect(data.amendable ? `/rep/order/${data.orderId}/edit` : `/rep/orders?order=${data.orderId}`);

  return (
    <>
      <WindowBanner window={w} level="h2" />
      <h1 className="mt-10 text-3xl font-bold text-ink sm:text-[32px]">Place Quarterly Order</h1>
      <p className="mt-3 max-w-[720px] text-base leading-relaxed text-muted">
        Enter quantities for each lesson book category below. You can amend your order quantities anytime before the deadline or until your order is collected.
      </p>

      {data.kind === "blocked" ? (
        <Blocked title="You can't place an order right now" body={data.reason} />
      ) : data.kind === "ready" ? (
        <div className="mt-8 space-y-6">
          <OrderIntro org={org} />
          <OrderForm mode="place" lines={data.lines} orgType={org.type} quarterName={w.quarter!.name} deadline={w.deadline!} />
        </div>
      ) : null}
    </>
  );
}