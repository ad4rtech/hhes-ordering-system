import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { loadQuarters } from "@/lib/admin/quarters";
import { QuartersView } from "@/components/admin/quarters/QuartersView";

export const metadata: Metadata = { title: "Quarters" };

export default async function QuartersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const extend = typeof sp.extend === "string" ? sp.extend : undefined;
  const data = await loadQuarters(await createClient());
  return <QuartersView {...data} extendOrgId={extend} openNew={sp.new === "1"} />;
}