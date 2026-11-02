import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRepContext } from "@/lib/rep/context";
import { loadRepDashboard } from "@/lib/rep/dashboard";
import { WindowBanner } from "@/components/rep/dashboard/WindowBanner";
import { OrderCard } from "@/components/rep/dashboard/OrderCard";
import { PastQuarter } from "@/components/rep/dashboard/PastQuarter";
import { ActivityCard } from "@/components/rep/dashboard/ActivityCard";
import { LiveRefresh } from "@/components/rep/LiveRefresh";

export const metadata: Metadata = { title: "Dashboard" };

export default async function RepDashboardPage() {
  const ctx = await getRepContext();
  if (!ctx) redirect("/login");
  const { current, past, activity } = await loadRepDashboard(ctx);

  return (
    <>
      <LiveRefresh />
      <WindowBanner window={ctx.window} />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-6">
          <OrderCard order={current} window={ctx.window} />
          {past && <PastQuarter order={past} />}
        </div>
        <ActivityCard events={activity} />
      </div>
    </>
  );
}