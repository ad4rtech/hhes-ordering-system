import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listOrganisations } from "@/lib/admin/organisations";
import { PageHeader } from "@/components/admin/PageHeader";
import { PendingRegistrations } from "@/components/admin/PendingRegistrations";
import { OrganisationsList } from "@/components/admin/OrganisationsList";

export const metadata: Metadata = { title: "Organisations" };

export default async function OrganisationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => { const v = sp[k]; return Array.isArray(v) ? v[0] : v; };

  const supabase = await createClient();
  const [pending, list] = await Promise.all([
    listOrganisations(supabase, { status: "pending", pageSize: 50 }),
    listOrganisations(supabase, {
      q: one("q"), status: one("status"), type: one("type"),
      exclude: "pending", page: Number(one("page") ?? 1), pageSize: 10,
    }),
  ]);

  return (
    <>
      <PageHeader title="Organisation Management" subtitle="Review registration requests and manage affiliated organisations." />
      <PendingRegistrations rows={pending.rows} />
      <OrganisationsList rows={list.rows} count={list.count} page={list.page} pageSize={list.pageSize}
        filters={{ q: one("q") ?? "", status: one("status") ?? "", type: one("type") ?? "" }} />
    </>
  );
}