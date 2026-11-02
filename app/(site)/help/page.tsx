import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { FaqBrowser } from "@/components/site/FaqBrowser";
import { Callout } from "@/components/site/Callout";
import { buttonStyles } from "@/components/ui/Button";
import { Bullets } from "@/components/site/Prose";
import { getHelp } from "@/lib/help";
import { SITE, telHref } from "@/lib/site";
import { NAV } from "@/lib/nav";
import { pageMeta } from "@/lib/seo";


export const metadata = pageMeta({ title: "Help and Support", path: "/help",
  description: "Troubleshooting for HHES Kenya's lesson ordering system: signing in, passwords, ordering, M-Pesa payments, pickup and refunds." });

export default function HelpPage() {
  const { categories, popular } = getHelp();

  return (
    <>
      <PageHero crumb="Help and Support" title="Help and Support"
        intro="Something not working? Find your problem below, try the quick fix, and contact us if it's still stuck." />

      <div className="mx-auto max-w-[900px] px-5 py-14 sm:px-8 sm:py-16">
        <section aria-labelledby="popular">
          <h2 id="popular" className="font-sans text-xl font-semibold text-ink">Most common problems</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {popular.map((p) => (
              <li key={p.id}>
                <a href={`#${p.id}`} className="flex items-center justify-between gap-3 rounded-field border border-line bg-surface px-5 py-4 text-[15px] font-medium text-ink transition-colors hover:border-primary hover:bg-primary-soft/50">
                  {p.title} <ArrowRight size={16} className="shrink-0 text-muted" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8">
          <Callout tone="tip" title="Before you contact us, try these three things">
            <p>Refresh the page. Check you're signed in with your organisation's own account. And look in your spam folder if you're waiting for an email. These fix most problems.</p>
          </Callout>
        </div>

        <div className="mt-12">
          <FaqBrowser categories={categories} noun={["problem", "problems"]} placeholder="Describe your problem, e.g. password, M-Pesa, greyed out..." />
        </div>

        <section className="mt-16 rounded-card border border-line bg-panel px-6 py-10 sm:px-10">
          <h2 className="font-sans text-2xl font-semibold text-ink">Still stuck?</h2>
          <p className="mt-3 max-w-[560px] text-base leading-relaxed text-muted">Tell us what happened and we'll sort it out. The more you include, the faster we can help:</p>
          <div className="mt-4 max-w-[560px] text-base leading-relaxed text-muted">
            <Bullets items={[
              <>Your <strong className="font-medium text-ink">organisation's name</strong>.</>,
              <>The <strong className="font-medium text-ink">order reference</strong> (like HHES-A1B2C3D4), if it's about an order.</>,
              <>The <strong className="font-medium text-ink">M-Pesa receipt number</strong>, if it's about a payment.</>,
              <>What you expected, what happened instead, and any message you saw.</>,
            ]} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={NAV.contact} className={buttonStyles()}>Contact Centre</Link>
            {SITE.phone && <a href={telHref(SITE.phone)} className={buttonStyles({ variant: "outline" })}><Phone size={16} aria-hidden /> Call {SITE.phone}</a>}
            <Link href={NAV.faqs} className={buttonStyles({ variant: "outline" })}>FAQs</Link>
          </div>
        </section>
      </div>
    </>
  );
}