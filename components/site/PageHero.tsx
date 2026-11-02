import Link from "next/link";
import type { ReactNode } from "react";

export function PageHero({ title, intro, crumb, updated, children }: {
  title: string; intro: ReactNode; crumb: string; updated?: string; children?: ReactNode;
}) {
  return (
    <section className="border-b border-line bg-canvas px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-[1200px]">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/" className="hover:text-ink">Home</Link><span className="mx-2">/</span><span className="text-ink">{crumb}</span>
        </nav>
        <h1 className="mt-5 max-w-[820px] text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-[720px] text-lg leading-relaxed text-muted">{intro}</p>
        {updated && <p className="mt-4 text-sm text-muted">Last updated: {updated}</p>}
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}