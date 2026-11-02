import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRepContext } from "@/lib/rep/context";
import { loadMyOrders } from "@/lib/rep/myOrders";
import { WindowBanner } from "@/components/rep/dashboard/WindowBanner";
import { MyOrdersView } from "@/components/rep/orders/MyOrdersView";

export const metadata: Metadata = { title: "My Orders" };

export default async function MyOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const ctx = await getRepContext();
  if (!ctx) redirect("/login");
  const { current, history, dates } = await loadMyOrders(ctx);

  return (
    <>
      <WindowBanner window={ctx.window} level="h2" />
      <MyOrdersView
        key={typeof sp.order === "string" ? sp.order : "list"}
        current={current} history={history} dates={dates} window={ctx.window}
        pickup={{ address: process.env.HHES_ADDRESS ?? "HHES Centre", hours: process.env.HHES_OFFICE_HOURS ?? "" }}
        openOrder={typeof sp.order === "string" ? sp.order : undefined}
      />
    </>
  );
}