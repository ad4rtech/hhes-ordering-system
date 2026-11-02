import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { loadDashboard } from "@/lib/admin/dashboard";
import { DashboardView } from "@/components/admin/dashboard/DashboardView";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const data = await loadDashboard(await createClient());
  return <DashboardView {...data} />;
}