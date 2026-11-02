"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function PageToc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) setActive(top.target.id);
    }, { rootMargin: "-15% 0px -70% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);

  return (
    <>
      <details className="mb-8 rounded-field border border-line bg-surface lg:hidden">
        <summary className="cursor-pointer list-none px-4 py-3.5 text-[15px] font-medium text-ink [&::-webkit-details-marker]:hidden">On this page</summary>
        <ul className="border-t border-line p-2">
          {items.map((i) => <li key={i.id}><a href={`#${i.id}`} className="block rounded-md px-3 py-2 text-[15px] text-muted hover:bg-canvas hover:text-ink">{i.label}</a></li>)}
        </ul>
      </details>
      <nav aria-label="On this page" className="sticky top-24 hidden lg:block">
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">On this page</p>
        <ul className="space-y-0.5 border-l border-line">
          {items.map((i) => (
            <li key={i.id}>
              <a href={`#${i.id}`} onClick={() => setActive(i.id)} aria-current={active === i.id ? "true" : undefined}
                className={cn("-ml-px block border-l-2 py-1.5 pl-4 text-[15px] transition-colors",
                  active === i.id ? "border-primary font-medium text-primary" : "border-transparent text-muted hover:text-ink")}>
                {i.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}