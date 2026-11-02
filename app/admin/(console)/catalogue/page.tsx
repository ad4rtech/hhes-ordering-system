import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadCatalogue } from "@/lib/admin/catalogue";
import { PageHeader } from "@/components/admin/PageHeader";
import { CatalogueEditor } from "@/components/admin/catalogue/CatalogueEditor";
import { buttonStyles } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Catalogue" };

export default async function CataloguePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const quarter = typeof sp.quarter === "string" ? sp.quarter : undefined;
  const { selected, ...rest } = await loadCatalogue(await createClient(), quarter);

  if (!selected) {
    return (
      <>
        <PageHeader title="Catalogue Management" subtitle="Set quarterly pricing and initial stock levels for the six fixed lesson categories." />
        <div className="rounded-card border border-line bg-surface px-6 py-16 text-center">
          <h2 className="font-sans text-lg font-semibold text-ink">No quarters yet</h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">Prices and stock belong to a quarter. Create one first, then come back to set its catalogue.</p>
          <Link href="/admin/quarters" className={buttonStyles() + " mt-6"}>Go to Quarters</Link>
        </div>
      </>
    );
  }

  // key resets the editor's form state when you switch quarters
  return <CatalogueEditor key={selected.id} selected={selected} {...rest} />;
}