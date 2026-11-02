"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, SearchX } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { FaqCategory } from "@/lib/faqs";

export function FaqBrowser({ categories, placeholder = "Search the FAQs, e.g. refund, M-Pesa, deadline...", noun = ["question", "questions"] }: {
  categories: FaqCategory[]; placeholder?: string; noun?: [string, string];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const total = categories.reduce((n, c) => n + c.faqs.length, 0);
  const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);

  const visible = useMemo(
    () => categories
      .map((c) => ({
        ...c,
        faqs: c.faqs.filter((x) =>
          (tokens.length > 0 || cat === "all" || c.id === cat) &&
          tokens.every((t) => `${x.q} ${x.a} ${(x.steps ?? []).join(" ")}`.toLowerCase().includes(t))),
      }))
      .filter((c) => c.faqs.length > 0),
    [categories, cat, q], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const shown = visible.reduce((n, c) => n + c.faqs.length, 0);
  const allIds = visible.flatMap((c) => c.faqs.map((x) => x.id));
  const allOpen = allIds.length > 0 && allIds.every((id) => open.has(id));
  const word = (n: number) => (n === 1 ? noun[0] : noun[1]);

  // Links like /help#i-can-t-sign-in open that answer
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id || !categories.some((c) => c.faqs.some((x) => x.id === id))) return;
      setCat("all"); setQ("");
      setOpen((s) => new Set(s).add(id));
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "center" }), 60);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [categories]);

  function toggle(id: string) {
    setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else { n.add(id); history.replaceState(null, "", `#${id}`); } return n; });
  }
  const chip = (id: string, label: string, count: number) => (
    <button key={id} type="button" onClick={() => setCat(id)} aria-pressed={cat === id && tokens.length === 0}
      className={cn("shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[15px] font-medium transition-colors",
        cat === id && tokens.length === 0 ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink hover:bg-canvas")}>
      {label} <span className={cat === id && tokens.length === 0 ? "text-white/80" : "text-muted"}>{count}</span>
    </button>
  );

  return (
    <div>
      <div className="relative">
        <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Search"
          className="h-14 w-full rounded-card border border-line bg-surface pl-12 pr-4 text-base text-ink placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15" />
      </div>

      <div className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="Topics">
        {chip("all", "All", total)}
        {categories.map((c) => chip(c.id, c.title, c.faqs.length))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-[15px] text-muted" aria-live="polite">
          {tokens.length > 0 ? `${shown} ${shown === 1 ? "result" : "results"} for “${q.trim()}”` : `${shown} ${word(shown)}`}
        </p>
        {shown > 0 && (
          <button type="button" className="text-[15px] font-medium text-primary hover:underline"
            onClick={() => setOpen((s) => { const n = new Set(s); allIds.forEach((id) => (allOpen ? n.delete(id) : n.add(id))); return n; })}>
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        )}
      </div>

      {shown === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-panel text-muted"><SearchX size={24} aria-hidden /></span>
          <h2 className="font-sans text-lg font-semibold text-ink">Nothing matches “{q.trim()}”</h2>
          <p className="max-w-sm text-[15px] leading-relaxed text-muted">Try fewer or different words, or ask us directly and we'll help.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => { setQ(""); setCat("all"); }}>Clear search</Button>
            <Link href="/contact" className={buttonStyles()}>Contact Centre</Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-10">
          {visible.map((c) => (
            <section key={c.id} aria-labelledby={`cat-${c.id}`}>
              {(cat === "all" || tokens.length > 0) && <h2 id={`cat-${c.id}`} className="mb-4 font-sans text-xl font-semibold text-ink">{c.title}</h2>}
              <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
                {c.faqs.map((x) => {
                  const isOpen = open.has(x.id);
                  return (
                    <li key={x.id} id={x.id} className="scroll-mt-24">
                      <h3>
                        <button type="button" id={`q-${x.id}`} aria-expanded={isOpen} aria-controls={`a-${x.id}`} onClick={() => toggle(x.id)}
                          className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left hover:bg-canvas sm:px-8">
                          <span className="font-sans text-[17px] font-semibold leading-snug text-ink">{x.q}</span>
                          <ChevronDown size={20} className={cn("shrink-0 text-muted transition-transform", isOpen && "rotate-180")} aria-hidden />
                        </button>
                      </h3>
                      <div id={`a-${x.id}`} role="region" aria-labelledby={`q-${x.id}`} hidden={!isOpen} className="px-6 pb-6 sm:px-8">
                        <div className="max-w-[760px] space-y-3 text-base leading-relaxed text-muted">
                          {x.a.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
                        </div>
                        {x.steps && (
                          <ol className="mt-4 max-w-[760px] space-y-3 text-base leading-relaxed text-muted">
                            {x.steps.map((s, i) => (
                              <li key={i} className="flex gap-3">
                                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{i + 1}</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                        {x.links && (
                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                            {x.links.map((l) => <Link key={l.href + l.label} href={l.href} className="text-[15px] font-medium text-primary hover:underline">{l.label} →</Link>)}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}