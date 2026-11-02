"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, Lock, Save, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { saveCatalogue } from "@/lib/admin/catalogueActions";
import { CATEGORIES, type CatalogueData, type CatQuarter } from "@/lib/admin/catalogue";
import { notify } from "@/lib/notify";
import { kes } from "@/lib/utils/format";
import { cn } from "@/lib/cn";

type Vals = Record<string, { price: string; stock: string }>;
type Errors = Record<string, { price?: string; stock?: string }>;

const STATUS_LABEL = { draft: "Draft", published: "Published", closed: "Closed" } as const;
const MAX_PRICE = 100_000;
const MAX_STOCK = 1_000_000;

function NumberBox({ value, onChange, prefix, suffix, disabled, locked, error, label }: {
  value: string; onChange: (v: string) => void; prefix?: string; suffix?: string;
  disabled?: boolean; locked?: boolean; error?: string; label: string;
}) {
  return (
    <div>
      <div className={cn(
        "flex h-11 w-full max-w-[220px] items-center gap-2 rounded-field border bg-field px-3.5 text-[15px] transition-colors",
        error ? "border-danger" : "border-line",
        !disabled && "focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15",
        disabled && "bg-panel/60",
      )}>
        {prefix && <span className="text-muted">{prefix}</span>}
        <input inputMode="numeric" value={value} disabled={disabled} aria-label={label} aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 7))}
          onBlur={() => { if (value !== "") onChange(String(Number(value))); }}
          className="min-w-0 flex-1 bg-transparent font-mono font-medium text-ink outline-none disabled:text-muted" />
        {suffix && <span className="text-muted">{suffix}</span>}
        {locked && <Lock size={14} className="shrink-0 text-muted" aria-label="Locked" />}
      </div>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function CatalogueEditor({ quarters, selected, items, reference }: Omit<CatalogueData, "selected"> & { selected: CatQuarter }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const initial = useMemo<Vals>(
    () => Object.fromEntries(items.map((i) => [i.slug, { price: String(i.price), stock: String(i.stock) }])),
    [items],
  );
  const [vals, setVals] = useState<Vals>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [switchTo, setSwitchTo] = useState<string | null>(null);

  const draft = selected.status === "draft";
  const published = selected.status === "published";
  const closed = selected.status === "closed";
  const priceLocked = !draft;

  const changed = CATEGORIES.filter((c) => vals[c.slug].price !== initial[c.slug].price || vals[c.slug].stock !== initial[c.slug].stock);
  const dirty = changed.length > 0;
  const pricesSet = CATEGORIES.filter((c) => Number(vals[c.slug].price) > 0).length;

  // Warn before closing the tab with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function edit(slug: string, field: "price" | "stock", v: string) {
    setVals((s) => ({ ...s, [slug]: { ...s[slug], [field]: v } }));
    setErrors((e) => ({ ...e, [slug]: { ...e[slug], [field]: undefined } }));
  }

  function validate(): Errors {
    const out: Errors = {};
    for (const c of changed) {
      const v = vals[c.slug];
      const e: { price?: string; stock?: string } = {};
      if (!priceLocked) {
        if (v.price === "") e.price = "Enter a price";
        else if (Number(v.price) > MAX_PRICE) e.price = `Maximum is ${kes(MAX_PRICE)}`;
      }
      if (v.stock === "") e.stock = "Enter a number";
      else if (Number(v.stock) > MAX_STOCK) e.stock = `Maximum is ${MAX_STOCK.toLocaleString("en-KE")}`;
      if (e.price || e.stock) out[c.slug] = e;
    }
    return out;
  }

  async function save() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { notify("common.validation"); return; }

    setSaving(true);
    const payload = changed.map((c) => draft
      ? { category_slug: c.slug, price_kes: Number(vals[c.slug].price), stock_quantity: Number(vals[c.slug].stock) }
      : { category_slug: c.slug, stock_quantity: Number(vals[c.slug].stock) });
    const ok = await saveCatalogue(selected.id, payload, draft ? "draft" : "published");
    setSaving(false);
    if (ok) startTransition(() => router.refresh());
  }

  const go = (id: string) => startTransition(() => router.push(`/admin/catalogue?quarter=${id}`));
  function pick(id: string) {
    if (id === selected.id) return;
    if (dirty) setSwitchTo(id); else go(id);
  }

  const callout = draft
    ? { icon: Info, title: "Prices are unlocked during Draft status.", body: <>You can freely edit pricing and initial stock quantities. Once the quarter is <strong className="font-semibold text-ink">Published</strong>, pricing will be permanently locked to ensure all organisations receive consistent quotes.</> }
    : published
    ? { icon: Lock, title: "Prices are locked.", body: <>This quarter is <strong className="font-semibold text-ink">Published</strong>, so pricing can't change. You can still adjust stock levels.</> }
    : { icon: Lock, title: "This quarter is closed.", body: <>Its catalogue is read-only.</> };
  const CalloutIcon = callout.icon;

  return (
    <>
      <PageHeader title="Catalogue Management" subtitle="Set quarterly pricing and initial stock levels for the six fixed lesson categories." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        {/* Pricing and inventory */}
        <section className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-sans text-xl font-semibold text-ink">{selected.name} Pricing &amp; Inventory</h2>
              <Badge tone={draft ? "soft" : published ? "successSoft" : "neutral"}>{draft ? "Draft Status" : STATUS_LABEL[selected.status]}</Badge>
            </div>
            {!closed && (
              <div className="flex items-center gap-4">
                {dirty && <span className="text-sm font-medium text-warning">Unsaved changes</span>}
                <Button loading={saving} disabled={!dirty} onClick={save}><Save size={18} aria-hidden /> Save Changes</Button>
              </div>
            )}
          </div>

          <div className="mx-6 mt-5 flex gap-3 rounded-field border border-line bg-panel p-4">
            <CalloutIcon size={20} className="mt-0.5 shrink-0 text-muted" aria-hidden />
            <div>
              <p className="text-[15px] font-medium text-ink">{callout.title}</p>
              <p className="mt-0.5 text-[15px] leading-relaxed text-muted">{callout.body}</p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto border-t border-line">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-panel">
                <tr>
                  <th className="px-6 py-4 text-[15px] font-medium text-muted">Lesson Category</th>
                  <th className="px-6 py-4 text-[15px] font-medium text-muted">Unit Price</th>
                  <th className="px-6 py-4 text-[15px] font-medium text-muted">Initial Stock Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const v = vals[c.slug];
                  return (
                    <tr key={c.slug}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-field border border-line bg-field text-ink"><Icon size={20} aria-hidden /></span>
                          <div>
                            <p className="text-base font-medium text-ink">{c.name}</p>
                            <p className="text-sm text-muted">{c.blurb}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <NumberBox prefix="KES" value={v.price} label={`${c.name} unit price in shillings`} disabled={priceLocked} locked={priceLocked}
                          error={errors[c.slug]?.price} onChange={(x) => edit(c.slug, "price", x)} />
                      </td>
                      <td className="px-6 py-5 align-top">
                        <NumberBox suffix="Units" value={v.stock} label={`${c.name} stock in units`} disabled={closed}
                          error={errors[c.slug]?.stock} onChange={(x) => edit(c.slug, "stock", x)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 text-sm">
            {draft ? (
              <>
                <span className={pricesSet === 6 ? "text-success" : "text-warning"}>{pricesSet} of 6 prices set. All six are needed to publish.</span>
                <Link href="/admin/quarters" className="font-medium text-primary hover:underline">Publish from the Quarters page</Link>
              </>
            ) : (
              <span className="text-muted">{published ? "Prices were locked when this quarter was published." : "This quarter is closed."}</span>
            )}
          </div>
        </section>

        {/* Right column */}
        <div className="space-y-6">
          <section className="overflow-hidden rounded-card border border-line bg-surface">
            <h2 className="flex items-center gap-3 border-b border-line px-6 py-5 font-sans text-lg font-semibold text-ink">
              <SlidersHorizontal size={20} className="text-primary" aria-hidden /> Quarter Selection
            </h2>
            <div className="p-6">
              <label htmlFor="quarter-select" className="mb-2 block text-[15px] font-medium text-ink">Edit Catalogue For</label>
              <select id="quarter-select" value={selected.id} onChange={(e) => pick(e.target.value)}
                className="h-11 w-full rounded-field border border-line bg-field px-3.5 text-[15px] text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15">
                {quarters.map((q) => <option key={q.id} value={q.id}>{q.name} ({STATUS_LABEL[q.status]})</option>)}
              </select>
              <Link href="/admin/quarters" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Manage quarters</Link>
            </div>
          </section>

          {reference && (
            <section className="overflow-hidden rounded-card border border-line bg-surface">
              <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-5">
                <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-ink">
                  {reference.quarter.status === "published" ? "Live Reference" : "Reference Prices"}
                  {reference.quarter.status === "published" && <Lock size={16} className="text-muted" aria-hidden />}
                </h2>
                <Badge tone="positive">{reference.quarter.name}</Badge>
              </div>
              <div className="p-6">
                <p className="text-[15px] leading-relaxed text-muted">
                  {reference.quarter.status === "published"
                    ? "Currently published prices. Use this as a reference while setting up the next quarter."
                    : `Prices from ${reference.quarter.name}, the most recent quarter with prices. Use them as a reference.`}
                </p>
                <ul className="mt-4">
                  {CATEGORIES.map((c) => (
                    <li key={c.slug} className="flex items-center justify-between border-b border-dashed border-line py-3 last:border-0 last:pb-0">
                      <span className="text-[15px] font-medium text-ink">{c.short}</span>
                      <span className="font-mono text-[15px] text-muted">{kes(reference.prices[c.slug] ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      </div>

      <ConfirmDialog open={!!switchTo} onClose={() => setSwitchTo(null)} tone="danger"
        title="Discard unsaved changes?" description="Switching quarters will lose the edits you haven't saved."
        confirmLabel="Discard and switch" onConfirm={() => { const id = switchTo!; setSwitchTo(null); go(id); }} />
    </>
  );
}